-- Add currency to quotes so makers quote in the job's local currency
alter table public.quotes
  add column if not exists currency text not null default 'CHF';

-- Add currency tracking to referral commissions
alter table public.referral_commissions
  add column if not exists currency text not null default 'CHF',
  add column if not exists commission_amount numeric;

-- Back-fill commission_amount from commission_chf for existing rows
update public.referral_commissions
  set commission_amount = commission_chf
  where commission_amount is null;
