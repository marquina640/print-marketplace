-- Add country field to printer_profiles for correct Stripe Connect account creation
alter table public.printer_profiles
  add column if not exists country char(2) default null;
