-- Store how many months referred makers get the reduced fee (per-code, negotiated with each creator)
alter table public.referral_codes
  add column if not exists referred_maker_commission_months int default null;
