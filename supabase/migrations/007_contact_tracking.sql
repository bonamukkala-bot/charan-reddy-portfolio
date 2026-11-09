-- 1. New pipeline statuses (drops the old status check by its definition, so the name doesn't matter)
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.leads'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%no_answer%'
  loop
    execute format('alter table public.leads drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.leads
  add constraint leads_status_check check (status in
    ('new','queued','calling','called','no_answer','failed','qualified',
     'contacted','proposal_sent','negotiating','won','lost'));

-- 2. Contact tracking columns
alter table public.leads
  add column if not exists contacted_at timestamptz,
  add column if not exists contact_method text,
  add column if not exists lost_reason text,
  add column if not exists lost_note text;

alter table public.leads drop constraint if exists leads_contact_method_check;
alter table public.leads add constraint leads_contact_method_check
  check (contact_method is null or contact_method in
    ('call','whatsapp','email','video_call','in_person','other'));

alter table public.leads drop constraint if exists leads_lost_reason_check;
alter table public.leads add constraint leads_lost_reason_check
  check (lost_reason is null or lost_reason in
    ('price','timing','no_response','not_a_fit','chose_other','project_cancelled','other'));

create index if not exists leads_contacted_idx on public.leads (contacted_at);

-- 3. Status history
create table if not exists public.lead_status_history (
  id bigint generated always as identity primary key,
  lead_id uuid not null references public.leads(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_at timestamptz not null default now(),
  changed_by uuid            -- null = automation (webhook or system), otherwise the admin user
);
create index if not exists lead_status_history_lead_idx
  on public.lead_status_history (lead_id, changed_at);
alter table public.lead_status_history enable row level security;

drop policy if exists "admins read status history" on public.lead_status_history;
create policy "admins read status history" on public.lead_status_history
  for select to authenticated using (public.is_admin());

grant select on public.lead_status_history to authenticated;
grant select, insert, update, delete on public.lead_status_history to service_role;

-- 4. Triggers (replace the old single trigger)
drop trigger if exists leads_status_changed on public.leads;
drop function if exists public.touch_status_changed_at();

create or replace function public.leads_before_write()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    new.status_changed_at := coalesce(new.status_changed_at, now());
    return new;
  end if;
  if new.status is distinct from old.status then
    new.status_changed_at := now();
    -- reaching a contact stage without a recorded contact time stamps it now
    if new.status in ('contacted','proposal_sent','negotiating') and new.contacted_at is null then
      new.contacted_at := now();
    end if;
    -- a lost reason only makes sense while the lead is lost
    if new.status <> 'lost' then
      new.lost_reason := null;
      new.lost_note := null;
    end if;
  end if;
  return new;
end $$;

create or replace function public.leads_log_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.lead_status_history (lead_id, from_status, to_status, changed_by)
    values (new.id, null, new.status, auth.uid());
  elsif new.status is distinct from old.status then
    insert into public.lead_status_history (lead_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return null;
end $$;

drop trigger if exists leads_before_write on public.leads;
create trigger leads_before_write before insert or update on public.leads
  for each row execute function public.leads_before_write();

drop trigger if exists leads_after_status on public.leads;
create trigger leads_after_status after insert or update on public.leads
  for each row execute function public.leads_log_status();

-- 5. Backfill one history row for each existing lead
insert into public.lead_status_history (lead_id, from_status, to_status, changed_at)
select l.id, null, l.status, coalesce(l.status_changed_at, l.created_at)
from public.leads l
where not exists (select 1 from public.lead_status_history h where h.lead_id = l.id);

-- 6. What the admin dashboard may write (besides status, notes and follow_up_at)
grant update (contacted_at, contact_method, lost_reason, lost_note) on public.leads to authenticated;