-- ============================================================
-- Migration 005 — Machine Profiles + Portfolio System
-- Run in Supabase SQL Editor AFTER 004_certification_and_job_type.sql
-- ============================================================

-- 1. Individual machine specs (a maker can have multiple machines)
create table if not exists public.machines (
  id               uuid primary key default uuid_generate_v4(),
  maker_id         uuid references auth.users(id) on delete cascade not null,
  brand            text not null,
  model            text not null,
  process          text not null default 'fdm'
                   check (process in ('fdm', 'resin', 'sls', 'cnc', 'laser', 'sheet_metal', 'other')),
  build_volume_x   numeric(8,1),   -- mm
  build_volume_y   numeric(8,1),
  build_volume_z   numeric(8,1),
  nozzle_diameter  numeric(4,2),   -- mm
  min_layer_height numeric(5,3),   -- mm
  max_layer_height numeric(5,3),   -- mm
  tolerance_mm     numeric(5,3),   -- ±mm capability
  is_active        boolean not null default true,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger trg_machines_updated_at
  before update on public.machines
  for each row execute function handle_updated_at();

create index if not exists idx_machines_maker_id on public.machines (maker_id);
create index if not exists idx_machines_process   on public.machines (process);

alter table public.machines enable row level security;

create policy "machines_select_all"
  on public.machines for select using (true);

create policy "machines_insert_own"
  on public.machines for insert with check (maker_id = auth.uid());

create policy "machines_update_own"
  on public.machines for update using (maker_id = auth.uid() or auth_is_admin());

create policy "machines_delete_own"
  on public.machines for delete using (maker_id = auth.uid() or auth_is_admin());

-- 2. Portfolio items — photos of past work
create table if not exists public.portfolio_items (
  id          uuid primary key default uuid_generate_v4(),
  maker_id    uuid references auth.users(id) on delete cascade not null,
  title       text not null,
  description text,
  image_url   text not null,
  material    text,
  process     text not null default 'fdm',
  job_type    text not null default 'functional'
              check (job_type in ('decorative', 'functional', 'engineering', 'production')),
  is_featured boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_portfolio_maker_id on public.portfolio_items (maker_id);

alter table public.portfolio_items enable row level security;

create policy "portfolio_select_all"
  on public.portfolio_items for select using (true);

create policy "portfolio_insert_own"
  on public.portfolio_items for insert with check (maker_id = auth.uid());

create policy "portfolio_update_own"
  on public.portfolio_items for update using (maker_id = auth.uid() or auth_is_admin());

create policy "portfolio_delete_own"
  on public.portfolio_items for delete using (maker_id = auth.uid() or auth_is_admin());
