-- Tracks automated emails sent to users, one row per user+type to prevent duplicates
CREATE TABLE IF NOT EXISTS email_sends (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL,
  email_type text        NOT NULL,
  sent_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, email_type)
);

-- Allow the cron job (service role) to read/write freely; no user-facing RLS needed
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role only" ON email_sends USING (false);
