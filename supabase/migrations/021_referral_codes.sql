create table public.referral_codes (
  id                uuid    primary key default gen_random_uuid(),
  code              text    unique not null,
  influencer_name   text    not null,
  influencer_email  text,
  instagram_handle  text,
  tier              text    check (tier in ('story', 'post', 'reel')),
  fee_waiver_months int,
  uses              int     default 0,
  waiver_activated  bool    default false,
  active            bool    default true,
  created_at        timestamptz default now()
);

alter table public.referral_codes enable row level security;

-- Anyone can read active codes (needed to validate a ref= param at signup)
create policy "referral_codes_read_active"
  on public.referral_codes for select
  using (active = true);

-- Only admins can insert/update/delete
create policy "referral_codes_admin_write"
  on public.referral_codes for all
  using (exists (select 1 from profiles where user_id = auth.uid() and role = 'admin'));

-- Track which referral code a maker used when signing up, and their fee waiver expiry
alter table public.printer_profiles
  add column if not exists referred_by       text references referral_codes(code),
  add column if not exists fee_waiver_until  timestamptz default null;
