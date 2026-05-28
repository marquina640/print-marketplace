-- ============================================================
-- Migration 009 — Shipping details on jobs
-- Run in Supabase SQL Editor AFTER 008_payment_flow.sql
-- ============================================================

alter table public.jobs
  add column if not exists in_person_delivery boolean not null default false,
  add column if not exists shipping_carrier   text,
  add column if not exists tracking_number    text,
  add column if not exists shipped_date       date;
