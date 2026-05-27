-- ============================================================
-- Migration 007 — Stripe session tracking on jobs
-- Run in Supabase SQL Editor AFTER 006_certification_requests_v2.sql
-- ============================================================

alter table public.jobs
  add column if not exists stripe_session_id text;
