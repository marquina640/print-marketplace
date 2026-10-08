-- Allow admins to read all quotes
create policy "quotes_select_admin"
  on public.quotes for select
  using (
    exists (
      select 1 from profiles
      where user_id = auth.uid()
      and role = 'admin'
    )
  );

-- Allow admins to read all job files
create policy "job_files_select_admin"
  on public.job_files for select
  using (
    exists (
      select 1 from profiles
      where user_id = auth.uid()
      and role = 'admin'
    )
  );
