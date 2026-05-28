-- ============================================================
-- Migration 008 — Payment flow columns and status values
-- Run in Supabase SQL Editor AFTER 007_stripe_session.sql
-- ============================================================

-- Extend the jobs status check constraint to include payment flow statuses
alter table public.jobs drop constraint if exists jobs_status_check;
alter table public.jobs
  add constraint jobs_status_check
  check (status in ('open','quoted','accepted','paid','shipped','delivered','in_progress','completed','cancelled'));

-- Add payment / fulfilment timestamp columns
alter table public.jobs
  add column if not exists paid_at      timestamptz,
  add column if not exists shipped_at   timestamptz,
  add column if not exists payout_at    timestamptz;
