alter table public.leads
  add column if not exists status_changed_at timestamptz,
  add column if not exists follow_up_at timestamptz;

-- existing rows: start from their creation time
update public.leads set status_changed_at = coalesce(status_changed_at, created_at);

create or replace function public.touch_status_changed_at()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    new.status_changed_at := coalesce(new.status_changed_at, now());
  elsif new.status is distinct from old.status then
    new.status_changed_at := now();
  end if;
  return new;
end $$;

drop trigger if exists leads_status_changed on public.leads;
create trigger leads_status_changed
  before insert or update on public.leads
  for each row execute function public.touch_status_changed_at();

create index if not exists leads_follow_up_idx on public.leads (follow_up_at) where follow_up_at is not null;

-- the admin may now also set the follow-up date
grant update (follow_up_at) on public.leads to authenticated;