-- ============================================================
-- Migration 006 — Certification Requests v2
-- Run in Supabase SQL Editor AFTER 005_machines_and_portfolio.sql
-- ============================================================

-- Add photo evidence + current_level snapshot to certification requests
alter table public.certification_requests
  add column if not exists photos        text[] not null default '{}',
  add column if not exists current_level integer not null default 0;

-- Unique constraint: only one pending request per maker at a time
-- (allows reapplication after rejection)
create unique index if not exists idx_cert_requests_pending_unique
  on public.certification_requests (maker_id)
  where status = 'pending';
