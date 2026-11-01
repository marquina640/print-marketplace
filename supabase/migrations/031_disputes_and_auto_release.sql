-- ============================================================
-- Migration 031 — Disputes and auto-release reminders
-- Run in Supabase SQL Editor AFTER 030_hourly_rate_currency.sql
-- ============================================================

-- Delivery reminder tracking on jobs
alter table public.jobs
  add column if not exists delivery_reminder_1_sent_at timestamptz,
  add column if not exists delivery_reminder_2_sent_at timestamptz;

-- Disputes table
create table if not exists public.disputes (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid not null references public.jobs(id) on delete cascade,
  client_id   uuid not null references auth.users(id) on delete cascade,
  reason      text not null,
  details     text,
  status      text not null default 'open'
                check (status in ('open','resolved','closed')),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

create index idx_disputes_job_id   on public.disputes(job_id);
create index idx_disputes_status   on public.disputes(status);

-- RLS
alter table public.disputes enable row level security;

-- Client can create a dispute for their own job
create policy "disputes_insert_client"
  on public.disputes for insert
  with check (
    auth.uid() = client_id
    and exists (
      select 1 from public.jobs j
      where j.id = job_id and j.client_id = auth.uid()
    )
  );

-- Client can read their own disputes
create policy "disputes_select_client"
  on public.disputes for select using (auth.uid() = client_id);

-- Admin can read all disputes
create policy "disputes_select_admin"
  on public.disputes for select using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

-- Admin can update dispute status
create policy "disputes_update_admin"
  on public.disputes for update using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );
