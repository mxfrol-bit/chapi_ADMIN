-- Chappy Candidate Lab · Supabase schema
-- Run in Supabase Dashboard → SQL Editor once.

create extension if not exists pgcrypto;

create table if not exists public.chappy_candidate_tests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  candidate_name text not null,
  contact text,
  telegram text,
  source text,

  profile jsonb not null default '{}'::jsonb,
  psychology jsonb not null default '{}'::jsonb,
  cases jsonb not null default '{}'::jsonb,
  trends jsonb not null default '[]'::jsonb,
  top_trends jsonb not null default '[]'::jsonb,
  packaging jsonb not null default '{}'::jsonb,
  kaizen jsonb not null default '{}'::jsonb,

  scores jsonb not null default '{}'::jsonb,
  recommendation jsonb not null default '{}'::jsonb,

  status text not null default 'submitted' check (status in ('submitted', 'reviewed', 'interview', 'reject', 'hired')),
  notes text
);

create index if not exists idx_chappy_candidate_tests_created_at on public.chappy_candidate_tests (created_at desc);
create index if not exists idx_chappy_candidate_tests_status on public.chappy_candidate_tests (status);
create index if not exists idx_chappy_candidate_tests_score on public.chappy_candidate_tests (((scores->>'total')::int));
create index if not exists idx_chappy_candidate_tests_trends_gin on public.chappy_candidate_tests using gin (trends);
create index if not exists idx_chappy_candidate_tests_recommendation_gin on public.chappy_candidate_tests using gin (recommendation);

-- Security model for this MVP:
-- Browser never receives SUPABASE_SERVICE_ROLE_KEY.
-- Railway Express server writes/reads with service role key.
-- Therefore public anon access can stay closed.
alter table public.chappy_candidate_tests enable row level security;

drop policy if exists "No public read" on public.chappy_candidate_tests;
drop policy if exists "No public insert" on public.chappy_candidate_tests;

-- Intentionally no anon/authenticated policies.
-- Service role key bypasses RLS from the Railway server.

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_chappy_candidate_tests_updated_at on public.chappy_candidate_tests;
create trigger set_chappy_candidate_tests_updated_at
before update on public.chappy_candidate_tests
for each row execute function public.set_updated_at();
