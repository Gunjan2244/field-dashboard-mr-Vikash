-- ============================================================================
-- Consolidated, idempotent schema for the Field Monitoring Dashboard.
--
-- Safe to run on a brand-new Supabase project OR against the existing
-- owiewmnanjdexslfmdzi project (every statement is guarded with
-- if-not-exists / drop-if-exists / or-replace, so re-running it changes
-- nothing that's already correct). This is the authoritative "what the
-- database should look like" script — it folds in the fix from
-- 20260903130000 (profiles RLS recursion) from the start instead of as a
-- patch, so a fresh project never hits that bug in the first place.
--
-- Run in the Supabase SQL editor, or: supabase db push
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------------
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------

create table if not exists public.districts (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz not null default now()
);

-- One row per login. id is shared 1:1 with auth.users(id) — created by the
-- admin-users edge function (service role), never by direct client insert.
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  email       text not null unique,
  role        text not null check (role in ('admin', 'employee')),
  district_id uuid references public.districts(id) on delete set null,
  status      text not null default 'active' check (status in ('active', 'inactive')),
  created_at  timestamptz not null default now()
);

create index if not exists profiles_district_id_idx on public.profiles(district_id);

create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  district_id uuid not null references public.districts(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),
  unique (district_id, name)
);

create table if not exists public.project_metric_fields (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  key         text not null,   -- machine key used inside daily_entries.metrics jsonb
  label       text not null,   -- what the employee sees on the entry form
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  unique (project_id, key)
);

create table if not exists public.daily_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  district_id uuid not null references public.districts(id) on delete restrict,
  project_id  uuid references public.projects(id) on delete restrict,
  entry_date  date not null,
  metrics     jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  unique (user_id, entry_date)
);

create index if not exists daily_entries_district_id_idx on public.daily_entries(district_id);
create index if not exists daily_entries_project_id_idx on public.daily_entries(project_id);
create index if not exists daily_entries_entry_date_idx on public.daily_entries(entry_date);

-- ----------------------------------------------------------------------------
-- security definer helper — the ONLY safe way to check "is this caller an
-- admin?" from inside a policy defined on profiles itself. A normal
-- `exists (select 1 from public.profiles ...)` inline in a profiles policy
-- re-triggers that same policy for the subquery and recurses forever
-- (Postgres error 42P17). Being security definer, this runs as its owner
-- (the role that ran this script, e.g. postgres) which bypasses RLS, so the
-- lookup inside it does not re-enter policy evaluation.
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.districts enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_metric_fields enable row level security;
alter table public.daily_entries enable row level security;

-- districts: everyone signed in can read; only admins write.
drop policy if exists "districts_select_authenticated" on public.districts;
create policy "districts_select_authenticated" on public.districts
  for select to authenticated using (true);

drop policy if exists "districts_admin_write" on public.districts;
create policy "districts_admin_write" on public.districts
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- profiles: read own row, or any row if admin. Only admins can update rows
-- (district assignment, active/inactive). No insert/delete policy — those go
-- through the admin-users edge function using the service role key, which
-- independently verifies the caller is an admin before bypassing RLS.
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- projects / project_metric_fields: everyone signed in can read (needed to
-- render the entry form and dashboards); only admins define structure.
drop policy if exists "projects_select_authenticated" on public.projects;
create policy "projects_select_authenticated" on public.projects
  for select to authenticated using (true);

drop policy if exists "projects_admin_write" on public.projects;
create policy "projects_admin_write" on public.projects
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "project_fields_select_authenticated" on public.project_metric_fields;
create policy "project_fields_select_authenticated" on public.project_metric_fields
  for select to authenticated using (true);

drop policy if exists "project_fields_admin_write" on public.project_metric_fields;
create policy "project_fields_admin_write" on public.project_metric_fields
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- daily_entries: employees manage only their own rows, and only within a
-- rolling 2-day edit window; admins see and manage everything, with no time
-- restriction, but still can't backdate past "today" on insert.
drop policy if exists "entries_select_own_or_admin" on public.daily_entries;
create policy "entries_select_own_or_admin" on public.daily_entries
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "entries_insert_own" on public.daily_entries;
create policy "entries_insert_own" on public.daily_entries
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and entry_date >= (current_date - interval '2 days')
    and entry_date <= current_date
  );

drop policy if exists "entries_update_own_recent_or_admin" on public.daily_entries;
create policy "entries_update_own_recent_or_admin" on public.daily_entries
  for update to authenticated
  using (
    (user_id = auth.uid() and entry_date >= (current_date - interval '2 days'))
    or public.is_admin()
  )
  with check (
    (user_id = auth.uid() and entry_date >= (current_date - interval '2 days'))
    or public.is_admin()
  );

drop policy if exists "entries_admin_delete" on public.daily_entries;
create policy "entries_admin_delete" on public.daily_entries
  for delete to authenticated
  using (public.is_admin());
