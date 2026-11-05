create extension if not exists "pgcrypto";

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- what the visitor typed in the form
  name text not null,
  email text not null,
  phone text not null,                    -- stored as +91XXXXXXXXXX
  project_type text,
  budget text,
  timeline text,
  preferred_language text not null default 'en'
    check (preferred_language in ('en','te')),
  message text not null,

  -- consent record
  consent_given boolean not null default false,
  consent_at timestamptz,
  consent_text text,

  -- pipeline
  status text not null default 'new'
    check (status in ('new','queued','calling','called','no_answer','failed','qualified','won','lost')),
  call_attempts int not null default 0,
  omni_call_id text,
  call_started_at timestamptz,
  call_ended_at timestamptz,

  -- filled by the voice agent after the call
  call_transcript text,
  ai_summary text,
  extracted jsonb,                        -- budget, timeline, goals, etc. from the call
  fit_score int check (fit_score between 1 and 10),

  -- abuse protection
  source_ip text,
  notes text
);

create index leads_created_at_idx on public.leads (created_at desc);
create index leads_status_idx on public.leads (status);
create index leads_phone_idx on public.leads (phone, created_at desc);
create index leads_ip_idx on public.leads (source_ip, created_at desc);

-- Lock the table: the browser never touches it directly.
-- Only the Edge Functions (service role) write. Dashboard login policies come later.
alter table public.leads enable row level security;