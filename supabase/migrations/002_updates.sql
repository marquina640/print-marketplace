-- ============================================================
-- Migration 002 — Feature Updates
-- Run this in Supabase SQL Editor AFTER 001_initial_schema.sql
-- ============================================================

-- 1. Quote image upload (item 1)
alter table public.quotes
  add column if not exists image_url text;

-- 2. Mutual reviews — add is_public flag (item 4)
alter table public.reviews
  add column if not exists is_public boolean not null default false;

-- Trigger: when both parties review a job, publish both reviews atomically
create or replace function public.check_mutual_review()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_job_id   uuid;
  v_other_id uuid;
begin
  v_job_id := new.job_id;

  -- Check if the other party has already reviewed
  select id into v_other_id
  from public.reviews
  where job_id = v_job_id
    and reviewer_id != new.reviewer_id
  limit 1;

  -- Both reviews now exist → publish both
  if found then
    update public.reviews
    set is_public = true
    where job_id = v_job_id;
  end if;

  return new;
end;
$$;

create trigger trg_mutual_review
  after insert on public.reviews
  for each row execute function check_mutual_review();

-- 3. Geo coordinates for map feature (item 6)
alter table public.printer_profiles
  add column if not exists latitude  double precision,
  add column if not exists longitude double precision;

alter table public.jobs
  add column if not exists latitude  double precision,
  add column if not exists longitude double precision;

-- Indexes on coordinates for proximity queries
create index if not exists idx_printer_profiles_geo
  on public.printer_profiles using btree (latitude, longitude)
  where latitude is not null and longitude is not null;

create index if not exists idx_jobs_geo
  on public.jobs using btree (latitude, longitude)
  where latitude is not null and longitude is not null;

-- 4. Quote images storage bucket policy
-- Run separately in SQL Editor if needed:
-- create policy "quote_images_upload" on storage.objects
--   for insert with check (bucket_id = 'quote-images' and auth.role() = 'authenticated');
-- create policy "quote_images_read" on storage.objects
--   for select using (bucket_id = 'quote-images' and auth.role() = 'authenticated');

-- 5. RLS for is_public reviews — override select to only show public reviews to non-participants
drop policy if exists "reviews_select_all" on public.reviews;

create policy "reviews_select_public_or_own"
  on public.reviews for select using (
    is_public = true
    or reviewer_id = auth.uid()
    or reviewee_id = auth.uid()
    or auth_is_admin()
  );
