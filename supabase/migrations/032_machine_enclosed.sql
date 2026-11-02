alter table public.machines
  add column if not exists is_enclosed boolean not null default false;
