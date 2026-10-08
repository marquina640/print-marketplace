alter table public.printer_profiles
  add column if not exists referral_free_jobs_remaining int default null;
