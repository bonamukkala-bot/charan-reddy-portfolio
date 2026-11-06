-- Who is allowed into the dashboard
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Admins can read all lead columns, but change only status and notes
grant select on public.leads to authenticated;
grant update (status, notes) on public.leads to authenticated;

create policy "admins read leads" on public.leads
  for select to authenticated using (public.is_admin());
create policy "admins update leads" on public.leads
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Live updates in the dashboard (Realtime respects the policies above)
alter publication supabase_realtime add table public.leads;