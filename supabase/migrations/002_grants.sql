-- The Edge Functions (service_role) must be able to read and write leads.
grant usage on schema public to service_role;
grant select, insert, update, delete on table public.leads to service_role;

-- Same access for any table we create later in this project.
alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;