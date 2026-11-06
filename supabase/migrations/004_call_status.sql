alter table public.leads
  add column if not exists call_status text,
  add column if not exists call_duration text,
  add column if not exists hangup_source text;