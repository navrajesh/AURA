-- ============================================================================
-- 01-roles.sql — Grants and default privileges for the two limited roles.
--
-- Role *creation* with passwords is done by scripts/setup-roles.ts because
-- the postgres-js driver doesn't support psql-style :variable substitution.
-- This file applies grants that are safe to re-run.
-- ============================================================================

-- Both roles need schema usage + table CRUD.
grant usage on schema public to app_user, app_admin;
grant select, insert, update, delete on all tables in schema public to app_user, app_admin;
grant usage, select on all sequences in schema public to app_user, app_admin;

-- Default privileges for tables created later by the owner (drizzle-kit push).
alter default privileges in schema public
  grant select, insert, update, delete on tables to app_user, app_admin;
alter default privileges in schema public
  grant usage, select on sequences to app_user, app_admin;
