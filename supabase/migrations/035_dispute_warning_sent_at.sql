alter table public.disputes
  add column if not exists warning_sent_at timestamptz;
