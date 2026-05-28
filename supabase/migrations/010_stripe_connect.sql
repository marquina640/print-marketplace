-- ============================================================
-- Migration 010 — Stripe Connect on printer profiles
-- Run in Supabase SQL Editor AFTER 009_shipping_details.sql
-- ============================================================

alter table public.printer_profiles
  add column if not exists stripe_account_id         text,
  add column if not exists stripe_onboarding_complete boolean not null default false;
