alter table public.jobs
  add column if not exists deadline_passed_email_sent_at timestamptz;
