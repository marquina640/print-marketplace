CREATE TABLE IF NOT EXISTS job_invitations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id     UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  maker_id   UUID NOT NULL,
  client_id  UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(job_id, maker_id)
);

ALTER TABLE job_invitations ENABLE ROW LEVEL SECURITY;

-- Clients can create invitations for their own open jobs
CREATE POLICY "clients_insert_invitations"
  ON job_invitations FOR INSERT
  WITH CHECK (auth.uid() = client_id);

-- Both parties can read their own invitations
CREATE POLICY "parties_select_invitations"
  ON job_invitations FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = maker_id);
