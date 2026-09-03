-- ============================================================================
-- Migration: remove the legacy on_auth_user_created auto-profile trigger.
--
-- This project has no public self-signup flow — every employee account is
-- created explicitly by an admin via the `admin-users` Edge Function, which
-- already inserts the correct profiles row (name, role, district, status)
-- using the service role key.
--
-- A trigger from the initial project scaffold ran BEFORE that insert on
-- every new auth user and inserted its own default profiles row (role
-- hardcoded to 'employee', district_id null, name derived from the email
-- prefix). That raced the Edge Function's own insert and made it fail with:
--   duplicate key value violates unique constraint "profiles_pkey"
-- which in turn rolled back the whole account creation (the Edge Function
-- deletes the auth user again on any profile-insert error), so every attempt
-- to create an employee failed silently with no trace left in the tables.
-- ============================================================================
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
