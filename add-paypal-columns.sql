-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- Adds PayPal Commerce Platform columns to existing tables

-- On printer_profiles: store the maker's connected PayPal merchant ID
ALTER TABLE printer_profiles
  ADD COLUMN IF NOT EXISTS paypal_merchant_id         TEXT,
  ADD COLUMN IF NOT EXISTS paypal_onboarding_complete BOOLEAN DEFAULT FALSE;

-- On jobs: store the PayPal Order ID (used to capture / look up the payment)
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS paypal_order_id TEXT;

-- Optional index for fast webhook lookups by paypal_order_id
CREATE INDEX IF NOT EXISTS idx_jobs_paypal_order_id
  ON jobs (paypal_order_id)
  WHERE paypal_order_id IS NOT NULL;
