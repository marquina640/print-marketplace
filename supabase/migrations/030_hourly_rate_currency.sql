-- Add currency field for the maker's design/engineering hourly rate
alter table printer_profiles
  add column if not exists hourly_rate_currency text not null default 'CHF';
