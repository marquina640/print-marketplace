-- ============================================================
-- Migration 003 — Client profile fields + job image
-- Run this in Supabase SQL Editor AFTER 002_updates.sql
-- ============================================================

-- 1. Add client profile fields to profiles table
alter table public.profiles
  add column if not exists city    text,
  add column if not exists address text,
  add column if not exists bio     text,
  add column if not exists latitude  double precision,
  add column if not exists longitude double precision;

-- 2. Add reference image URL to jobs
alter table public.jobs
  add column if not exists image_url text;

-- 3. Allow the job-files storage bucket to store images too
--    (if you created a separate bucket for images, adjust the bucket name below)
--    The job-files bucket already exists; images are stored under job-images/ prefix.

-- 4. Storage policy: allow authenticated users to upload to job-files bucket
--    Run if not already created:
-- insert into storage.buckets (id, name, public)
--   values ('job-files', 'job-files', true)
--   on conflict (id) do nothing;

-- create policy "job_files_upload" on storage.objects
--   for insert with check (bucket_id = 'job-files' and auth.role() = 'authenticated');

-- create policy "job_files_read" on storage.objects
--   for select using (bucket_id = 'job-files');
