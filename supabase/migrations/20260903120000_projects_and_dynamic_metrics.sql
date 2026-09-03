-- ============================================================================
-- Migration: districts -> projects -> dynamic metric fields
-- Removes leave-request functionality entirely.
-- Run this once in the Supabase SQL editor (or via `supabase db push`) against
-- the mr_Vikash project. Safe to re-run: every step is guarded.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Remove everything related to leave requests
-- ----------------------------------------------------------------------------
drop table if exists public.leave_requests cascade;

-- ----------------------------------------------------------------------------
-- 2. Projects: admin-defined, each belongs to exactly one district
-- ----------------------------------------------------------------------------
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  district_id uuid not null references public.districts(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),
  unique (district_id, name)
);

-- ----------------------------------------------------------------------------
-- 3. Metric fields: fully dynamic, admin-defined, scoped to one project
-- ----------------------------------------------------------------------------
create table if not exists public.project_metric_fields (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  key         text not null,   -- machine key used inside daily_entries.metrics jsonb
  label       text not null,   -- what the employee sees on the entry form
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  unique (project_id, key)
);

-- ----------------------------------------------------------------------------
-- 4. Restructure daily_entries: replace the 7 fixed metric columns with a
--    project reference + a fully dynamic jsonb metrics blob.
-- ----------------------------------------------------------------------------
alter table public.daily_entries
  add column if not exists project_id uuid references public.projects(id) on delete restrict,
  add column if not exists metrics    jsonb not null default '{}'::jsonb;

alter table public.daily_entries drop column if exists schools_observed;
alter table public.daily_entries drop column if exists classes_observed;
alter table public.daily_entries drop column if exists students_attended;
alter table public.daily_entries drop column if exists teachers_observed;
alter table public.daily_entries drop column if exists field_visits;
alter table public.daily_entries drop column if exists stories_read;
alter table public.daily_entries drop column if exists seel_done;

-- Existing rows (if any) have no project — backfill is a manual, org-specific
-- decision, so we only enforce NOT NULL once you've confirmed there are no
-- orphaned rows. Uncomment once you've backfilled/cleared old data:
-- alter table public.daily_entries alter column project_id set not null;

-- ----------------------------------------------------------------------------
-- 5. Row Level Security
-- ----------------------------------------------------------------------------
alter table public.projects enable row level security;
alter table public.project_metric_fields enable row level security;

-- Everyone signed in can read the district/project/field structure so the
-- entry form and dashboards can render it.
drop policy if exists "projects_select_authenticated" on public.projects;
create policy "projects_select_authenticated" on public.projects
  for select to authenticated using (true);

drop policy if exists "project_fields_select_authenticated" on public.project_metric_fields;
create policy "project_fields_select_authenticated" on public.project_metric_fields
  for select to authenticated using (true);

-- Only admins can define/change the structure.
drop policy if exists "projects_admin_write" on public.projects;
create policy "projects_admin_write" on public.projects
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "project_fields_admin_write" on public.project_metric_fields;
create policy "project_fields_admin_write" on public.project_metric_fields
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- districts: same admin-write / everyone-read pattern (districts previously
-- had no insert/update/delete policy since only seed data existed — now the
-- admin manages these from the UI).
drop policy if exists "districts_select_authenticated" on public.districts;
create policy "districts_select_authenticated" on public.districts
  for select to authenticated using (true);

drop policy if exists "districts_admin_write" on public.districts;
create policy "districts_admin_write" on public.districts
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- daily_entries: re-assert the existing access pattern now that the shape
-- changed (employees manage their own rows within a 2-day window; admins see
-- and manage everything). Adjust these if your original policies differed.
drop policy if exists "entries_select_own_or_admin" on public.daily_entries;
create policy "entries_select_own_or_admin" on public.daily_entries
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

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
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    (user_id = auth.uid() and entry_date >= (current_date - interval '2 days'))
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "entries_admin_delete" on public.daily_entries;
create policy "entries_admin_delete" on public.daily_entries
  for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- profiles: admins manage everyone's row (district assignment, status);
-- everyone can read their own row and admins can read all.
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles
  for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Note: profile INSERT/DELETE for employee accounts is handled by the
-- `admin-users` edge function using the service role key, which bypasses RLS
-- by design (it independently verifies the caller is an admin before doing
-- anything). No public insert/delete policy is needed on profiles.
