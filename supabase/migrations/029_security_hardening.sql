-- H3: Tighten storage upload policy — users may only write to their own folder
-- (replaces the broad authenticated-upload policy from migration 028)
do $$
begin
  -- Drop the old broad policy if it exists
  if exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
    and policyname = 'job_files_authenticated_upload'
  ) then
    execute $p$ drop policy "job_files_authenticated_upload" on storage.objects $p$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
    and policyname = 'job_files_own_folder_upload'
  ) then
    execute $p$
      create policy "job_files_own_folder_upload" on storage.objects
        for insert with check (
          bucket_id = 'job-files'
          and auth.role() = 'authenticated'
          and auth.uid()::text = (storage.foldername(name))[1]
        );
    $p$;
  end if;
end $$;

-- M1: Restrict jobs SELECT — only participants (client, accepted printer, admins) can read a job
do $$
begin
  -- Drop any overly permissive existing SELECT policy on jobs
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'jobs'
    and policyname = 'jobs_select_all'
  ) then
    drop policy "jobs_select_all" on public.jobs;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'jobs'
    and policyname = 'jobs_select_participants'
  ) then
    create policy "jobs_select_participants" on public.jobs
      for select using (
        auth.uid() = client_id
        or exists (
          select 1 from public.quotes q
          where q.job_id = jobs.id
            and q.printer_id = auth.uid()
        )
        or exists (
          select 1 from public.profiles p
          where p.user_id = auth.uid()
            and p.role = 'admin'
        )
      );
  end if;
end $$;

-- Note (L3): stripe_account_id, paypal_email, paypal_merchant_id, fee_waiver_until on
-- printer_profiles cannot be hidden with row-level security (RLS is row-scoped, not
-- column-scoped). These are only ever selected by server-side admin-client code.
-- Ensure no client-side query ever requests those columns from printer_profiles.
