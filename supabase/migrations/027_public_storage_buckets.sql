-- Make storage buckets public so images are accessible
update storage.buckets set public = true where id = 'job-files';
update storage.buckets set public = true where id = 'avatars';
update storage.buckets set public = true where id = 'machine-photos';

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

-- Public read policy for machine-photos (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
    and policyname = 'machine_photos_public_read'
  ) then
    execute $p$
      create policy "machine_photos_public_read" on storage.objects
        for select using (bucket_id = 'machine-photos');
    $p$;
  end if;
end $$;
