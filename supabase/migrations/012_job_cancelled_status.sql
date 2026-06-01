-- Allow 'cancelled' as a valid job status
ALTER TABLE jobs
  DROP CONSTRAINT IF EXISTS jobs_status_check;

ALTER TABLE jobs
  ADD CONSTRAINT jobs_status_check
  CHECK (status IN (
    'open', 'quoted', 'accepted', 'paid',
    'shipped', 'delivered', 'completed', 'cancelled'
  ));
