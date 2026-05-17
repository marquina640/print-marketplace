-- ============================================================
-- Migration 004 — Certification System + Job Classification
-- Run in Supabase SQL Editor AFTER 003_client_profile_and_job_image.sql
-- ============================================================

-- 1. Maker certification level (0 = Community, 1 = Verified, 2 = Engineering, 3 = Production)
alter table public.printer_profiles
  add column if not exists certification_level integer not null default 0
  check (certification_level >= 0 and certification_level <= 3);

-- 2. Job classification type
alter table public.jobs
  add column if not exists job_type text not null default 'decorative'
  check (job_type in ('decorative', 'functional', 'engineering', 'production'));

-- 3. Manufacturing process (extensible for future CNC/laser/etc.)
alter table public.jobs
  add column if not exists process text not null default 'fdm'
  check (process in ('fdm', 'resin', 'sls', 'cnc', 'laser', 'sheet_metal', 'other'));

alter table public.printer_profiles
  add column if not exists processes text[] not null default '{fdm}';

-- 4. Index for filtering jobs by type and process
create index if not exists idx_jobs_type    on public.jobs (job_type);
create index if not exists idx_jobs_process on public.jobs (process);
create index if not exists idx_printer_certification on public.printer_profiles (certification_level);

-- 5. Certification requests table — makers request level upgrades, admin approves
create table if not exists public.certification_requests (
  id                uuid primary key default uuid_generate_v4(),
  maker_id          uuid references auth.users(id) on delete cascade not null,
  requested_level   integer not null check (requested_level between 1 and 3),
  status            text not null default 'pending'
                    check (status in ('pending', 'approved', 'rejected', 'more_info')),
  notes             text,
  admin_notes       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger trg_certification_requests_updated_at
  before update on public.certification_requests
  for each row execute function handle_updated_at();

-- RLS
alter table public.certification_requests enable row level security;

create policy "makers_own_requests"
  on public.certification_requests for select
  using (maker_id = auth.uid() or auth_is_admin());

create policy "makers_insert_requests"
  on public.certification_requests for insert
  with check (maker_id = auth.uid());

create policy "admin_update_requests"
  on public.certification_requests for update
  using (auth_is_admin());
