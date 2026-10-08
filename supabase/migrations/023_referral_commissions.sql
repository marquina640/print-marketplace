create table public.referral_commissions (
  id                  uuid    primary key default gen_random_uuid(),
  referral_code       text    not null references referral_codes(code),
  referred_maker_id   uuid    not null,
  job_id              uuid    not null,
  job_amount_chf      numeric not null,
  commission_chf      numeric not null,
  paid_out            bool    default false,
  paid_out_at         timestamptz,
  stripe_transfer_id  text,
  created_at          timestamptz default now()
);

alter table public.referral_commissions enable row level security;

create policy "commissions_admin_only"
  on public.referral_commissions for all
  using (exists (select 1 from profiles where user_id = auth.uid() and role = 'admin'));
