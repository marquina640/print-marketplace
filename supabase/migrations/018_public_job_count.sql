-- Allow anyone to read open jobs (needed for homepage stats and public job browsing)
create policy "jobs_select_open_public"
  on public.jobs for select
  using (status = 'open');
