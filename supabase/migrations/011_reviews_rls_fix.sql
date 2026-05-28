-- ============================================================
-- Migration 011 — Allow reviews on delivered jobs (not just completed)
-- ============================================================

drop policy if exists "reviews_insert_job_participant" on public.reviews;

create policy "reviews_insert_job_participant"
  on public.reviews for insert with check (
    auth.uid() = reviewer_id and
    exists (
      select 1 from public.jobs j
      where j.id = job_id
        and j.status in ('completed', 'delivered')
    )
  );
