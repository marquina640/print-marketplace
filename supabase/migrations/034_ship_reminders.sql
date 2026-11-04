alter table public.jobs
  add column if not exists ship_reminder_2d_sent_at  timestamptz,
  add column if not exists ship_reminder_1d_sent_at  timestamptz,
  add column if not exists ship_overdue_sent_at       timestamptz;
