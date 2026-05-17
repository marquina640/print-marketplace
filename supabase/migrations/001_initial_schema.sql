-- ============================================================
-- PrintMarketplace — Initial Schema
-- Run this in Supabase SQL Editor or via supabase db push
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- profiles — one per auth user, created automatically on signup
create table public.profiles (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users(id) on delete cascade not null unique,
  role         text check (role in ('client', 'printer_owner', 'admin')),
  display_name text,
  email        text not null,
  avatar_url   text,
  onboarding_complete boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- printer_profiles — extra profile data for printer owners
create table public.printer_profiles (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references auth.users(id) on delete cascade not null unique,
  display_name     text not null,
  city             text not null,
  location         text,
  service_radius_km integer not null default 50,
  num_printers     integer not null default 1,
  printer_models   text[] not null default '{}',
  materials        text[] not null default '{}',
  colors           text[] not null default '{}',
  design_services  boolean not null default false,
  shipping         boolean not null default false,
  local_delivery   boolean not null default false,
  pickup           boolean not null default true,
  hourly_rate      numeric(10,2),
  price_per_gram   numeric(10,4),
  description      text,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- jobs
create table public.jobs (
  id                uuid primary key default uuid_generate_v4(),
  client_id         uuid references auth.users(id) on delete cascade not null,
  title             text not null,
  description       text not null,
  material          text not null,
  color             text,
  quantity          integer not null default 1,
  deadline          date,
  budget            numeric(10,2),
  location          text,
  shipping_required boolean not null default false,
  status            text not null default 'open'
                    check (status in ('open','quoted','accepted','in_progress','completed','cancelled')),
  accepted_quote_id uuid, -- FK added below after quotes table
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- job_files — uploaded 3D model files attached to a job
create table public.job_files (
  id          uuid primary key default uuid_generate_v4(),
  job_id      uuid references public.jobs(id) on delete cascade not null,
  uploaded_by uuid references auth.users(id) on delete set null,
  file_name   text not null,
  file_url    text not null,
  file_size   bigint,
  file_type   text,
  created_at  timestamptz not null default now()
);

-- quotes — submitted by printer owners for a job
create table public.quotes (
  id             uuid primary key default uuid_generate_v4(),
  job_id         uuid references public.jobs(id) on delete cascade not null,
  printer_id     uuid references auth.users(id) on delete cascade not null,
  price          numeric(10,2) not null,
  lead_time_days integer not null,
  message        text,
  status         text not null default 'pending'
                 check (status in ('pending','accepted','rejected')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (job_id, printer_id)
);

-- forward FK on jobs.accepted_quote_id
alter table public.jobs
  add constraint jobs_accepted_quote_id_fkey
  foreign key (accepted_quote_id) references public.quotes(id) on delete set null;

-- FKs enabling PostgREST relational queries via profiles
-- quotes.printer_id → profiles.user_id  (lets us do profiles:printer_id(...))
-- jobs.client_id    → profiles.user_id  (lets us do profiles:client_id(...))
alter table public.quotes
  add constraint quotes_printer_profile_fkey
  foreign key (printer_id) references public.profiles(user_id) on delete cascade;

alter table public.jobs
  add constraint jobs_client_profile_fkey
  foreign key (client_id) references public.profiles(user_id) on delete cascade;

-- messages — between client and accepted printer owner per job
create table public.messages (
  id          uuid primary key default uuid_generate_v4(),
  job_id      uuid references public.jobs(id) on delete cascade not null,
  sender_id   uuid references auth.users(id) on delete cascade not null,
  receiver_id uuid references auth.users(id) on delete cascade not null,
  content     text not null,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

-- FKs on messages (must come after the table is created above)
alter table public.messages
  add constraint messages_sender_profile_fkey
  foreign key (sender_id) references public.profiles(user_id) on delete cascade;

alter table public.messages
  add constraint messages_receiver_profile_fkey
  foreign key (receiver_id) references public.profiles(user_id) on delete cascade;

-- reviews — post-completion ratings
create table public.reviews (
  id          uuid primary key default uuid_generate_v4(),
  job_id      uuid references public.jobs(id) on delete cascade not null,
  reviewer_id uuid references auth.users(id) on delete cascade not null,
  reviewee_id uuid references auth.users(id) on delete cascade not null,
  rating      integer not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now(),
  unique (job_id, reviewer_id)
);

-- platform_settings — key-value config, admin-managed
create table public.platform_settings (
  id          uuid primary key default uuid_generate_v4(),
  key         text not null unique,
  value       jsonb,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_jobs_client_id    on public.jobs(client_id);
create index idx_jobs_status       on public.jobs(status);
create index idx_jobs_created_at   on public.jobs(created_at desc);
create index idx_quotes_job_id     on public.quotes(job_id);
create index idx_quotes_printer_id on public.quotes(printer_id);
create index idx_messages_job_id   on public.messages(job_id);
create index idx_messages_created  on public.messages(created_at);
create index idx_job_files_job_id  on public.job_files(job_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- generic updated_at updater
create or replace function handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function handle_updated_at();

create trigger trg_printer_profiles_updated_at
  before update on public.printer_profiles
  for each row execute function handle_updated_at();

create trigger trg_jobs_updated_at
  before update on public.jobs
  for each row execute function handle_updated_at();

create trigger trg_quotes_updated_at
  before update on public.quotes
  for each row execute function handle_updated_at();

create trigger trg_platform_settings_updated_at
  before update on public.platform_settings
  for each row execute function handle_updated_at();

-- auto-create profile row when a user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY HELPERS
-- security definer functions bypass RLS on profiles, preventing
-- infinite recursion when policies on OTHER tables check roles.
-- ============================================================

-- Returns true if the current user is an admin
create or replace function public.auth_is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'admin'
  )
$$;

-- Returns the current user's role (or null if not found)
create or replace function public.auth_role()
returns text
language sql stable security definer
set search_path = public
as $$
  select role from public.profiles where user_id = auth.uid()
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles         enable row level security;
alter table public.printer_profiles enable row level security;
alter table public.jobs             enable row level security;
alter table public.job_files        enable row level security;
alter table public.quotes           enable row level security;
alter table public.messages         enable row level security;
alter table public.reviews          enable row level security;
alter table public.platform_settings enable row level security;

-- ---- profiles ----
create policy "profiles_select_all"
  on public.profiles for select using (true);

create policy "profiles_update_own"
  on public.profiles for update using (auth.uid() = user_id);

create policy "profiles_all_admin"
  on public.profiles for all using (auth_is_admin());

-- ---- printer_profiles ----
create policy "printer_profiles_select_all"
  on public.printer_profiles for select using (true);

create policy "printer_profiles_insert_own"
  on public.printer_profiles for insert with check (auth.uid() = user_id);

create policy "printer_profiles_update_own"
  on public.printer_profiles for update using (auth.uid() = user_id);

create policy "printer_profiles_all_admin"
  on public.printer_profiles for all using (auth_is_admin());

-- ---- jobs ----
create policy "jobs_select_authenticated"
  on public.jobs for select using (auth.role() = 'authenticated');

create policy "jobs_insert_client"
  on public.jobs for insert with check (
    auth.uid() = client_id and auth_role() = 'client'
  );

create policy "jobs_update_own_client"
  on public.jobs for update using (auth.uid() = client_id);

create policy "jobs_delete_own_open"
  on public.jobs for delete using (auth.uid() = client_id and status = 'open');

create policy "jobs_all_admin"
  on public.jobs for all using (auth_is_admin());

-- ---- job_files ----
create policy "job_files_select_participants"
  on public.job_files for select using (
    auth.uid() in (
      select j.client_id from public.jobs j where j.id = job_id
      union
      select q.printer_id from public.quotes q
        join public.jobs j2 on j2.id = q.job_id
        where q.job_id = job_files.job_id and q.status = 'accepted'
    )
  );

create policy "job_files_insert_client"
  on public.job_files for insert with check (
    auth.uid() = uploaded_by and
    auth.uid() in (select j.client_id from public.jobs j where j.id = job_id)
  );

create policy "job_files_all_admin"
  on public.job_files for all using (auth_is_admin());

-- ---- quotes ----
create policy "quotes_select_participants"
  on public.quotes for select using (
    auth.uid() = printer_id or
    auth.uid() in (select j.client_id from public.jobs j where j.id = job_id)
  );

create policy "quotes_insert_printer"
  on public.quotes for insert with check (
    auth.uid() = printer_id and
    auth_role() = 'printer_owner' and
    exists (select 1 from public.jobs j where j.id = job_id and j.status = 'open')
  );

create policy "quotes_update_own_printer"
  on public.quotes for update using (auth.uid() = printer_id);

create policy "quotes_all_admin"
  on public.quotes for all using (auth_is_admin());

-- ---- messages ----
create policy "messages_select_participants"
  on public.messages for select using (
    auth.uid() = sender_id or auth.uid() = receiver_id
  );

create policy "messages_insert_participants"
  on public.messages for insert with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.jobs j
      join public.quotes q on q.job_id = j.id and q.status = 'accepted'
      where j.id = messages.job_id
        and (j.client_id = auth.uid() or q.printer_id = auth.uid())
        and (j.client_id = messages.receiver_id or q.printer_id = messages.receiver_id)
    )
  );

create policy "messages_all_admin"
  on public.messages for all using (auth_is_admin());

-- ---- reviews ----
create policy "reviews_select_all"
  on public.reviews for select using (true);

create policy "reviews_insert_job_participant"
  on public.reviews for insert with check (
    auth.uid() = reviewer_id and
    exists (select 1 from public.jobs j where j.id = job_id and j.status = 'completed')
  );

-- ---- platform_settings ----
create policy "settings_admin_only"
  on public.platform_settings for all using (auth_is_admin());

-- ============================================================
-- STORAGE BUCKETS
-- Run these separately in Supabase Dashboard > Storage
-- or via: supabase storage create job-files
-- ============================================================
-- insert into storage.buckets (id, name, public) values ('job-files', 'job-files', false);
--
-- Storage RLS (run in SQL editor after creating bucket):
-- create policy "job_files_upload" on storage.objects for insert with check (
--   bucket_id = 'job-files' and auth.role() = 'authenticated'
-- );
-- create policy "job_files_download" on storage.objects for select using (
--   bucket_id = 'job-files' and auth.role() = 'authenticated'
-- );

-- ============================================================
-- SEED DATA
-- ============================================================

insert into public.platform_settings (key, value, description) values
  ('platform_fee_percent',  '10',                                      'Platform commission %'),
  ('max_file_size_mb',      '50',                                      'Max upload size in MB'),
  ('allowed_file_types',    '["stl","step","stp","3mf","zip","obj"]',  'Accepted 3D file extensions'),
  ('stripe_enabled',        'false',                                   'Stripe payments live flag'),
  ('maintenance_mode',      'false',                                   'Put site in read-only mode');
