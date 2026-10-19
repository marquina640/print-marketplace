-- Allow authenticated users to upload to job-files bucket
-- (job attachments and delivery photos both go here)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
    and policyname = 'job_files_authenticated_upload'
  ) then
    execute $p$
      create policy "job_files_authenticated_upload" on storage.objects
        for insert with check (
          bucket_id = 'job-files'
          and auth.role() = 'authenticated'
        );
    $p$;
  end if;
end $$;

-- Allow users to delete their own uploads (e.g. replacing a photo)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
    and policyname = 'job_files_owner_delete'
  ) then
    execute $p$
      create policy "job_files_owner_delete" on storage.objects
        for delete using (
          bucket_id = 'job-files'
          and auth.uid()::text = (storage.foldername(name))[1]
        );
    $p$;
  end if;
end $$;
