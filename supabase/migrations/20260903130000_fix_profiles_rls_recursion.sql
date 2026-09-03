-- ============================================================================
-- Fix: infinite recursion in RLS policies on public.profiles
--
-- profiles_select_own_or_admin and profiles_admin_update both checked "is the
-- caller an admin?" via `exists (select 1 from public.profiles ...)` inside a
-- policy defined ON public.profiles — evaluating that subquery re-triggers
-- the same policy, which re-runs the subquery, forever. Postgres surfaces
-- this as error 42P17 "infinite recursion detected in policy for relation
-- profiles", and it fires on every single SELECT/UPDATE of profiles, so no
-- one could ever fetch their own profile after signing in.
--
-- Fix: move the admin check into a `security definer` function. Being
-- security definer, it runs as its owner and does not re-apply RLS on the
-- table it queries, so it can safely check role from inside a policy on that
-- same table.
-- ============================================================================

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

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (
    id = auth.uid() or public.is_admin()
  );

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
