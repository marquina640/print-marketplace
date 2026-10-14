-- Replace job-count referral tracking with a 12-month time window
alter table public.printer_profiles
  add column if not exists referral_commission_until timestamptz default null;
