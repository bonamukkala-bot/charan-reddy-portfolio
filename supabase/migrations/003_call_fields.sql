alter table public.leads
  add column if not exists omni_request_id text,
  add column if not exists call_outcome text,
  add column if not exists call_sentiment text,
  add column if not exists do_not_call boolean not null default false,
  add column if not exists last_webhook jsonb;

create index if not exists leads_omni_request_idx on public.leads (omni_request_id);
create index if not exists leads_status_created_idx on public.leads (status, created_at);