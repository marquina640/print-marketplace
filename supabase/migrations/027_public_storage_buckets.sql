-- Make job-files bucket public so portfolio images are accessible
update storage.buckets
  set public = true
  where id = 'job-files';

-- Ensure avatars bucket is also public
update storage.buckets
  set public = true
  where id = 'avatars';

-- Public read policy for job-files (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
    and policyname = 'job_files_public_read'
  ) then
    execute $p$
      create policy "job_files_public_read" on storage.objects
        for select using (bucket_id = 'job-files');
    $p$;
  end if;
end $$;

-- Public read policy for avatars (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
    and policyname = 'avatars_public_read'
  ) then
    execute $p$
      create policy "avatars_public_read" on storage.objects
        for select using (bucket_id = 'avatars');
    $p$;
  end if;
end $$;
