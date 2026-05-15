-- ============================================================================
-- 02-rls.sql — Enable RLS and install policies on every tenant-scoped table.
--
-- Re-runnable: each policy is dropped if it exists, then recreated.
-- ============================================================================

-- ----- tenants --------------------------------------------------------------
alter table tenants enable row level security;
alter table tenants force row level security;

drop policy if exists tenants_self on tenants;
create policy tenants_self on tenants
  for select to app_user
  using (id = current_setting('app.current_tenant', true)::uuid);

drop policy if exists tenants_admin_all on tenants;
create policy tenants_admin_all on tenants
  for all to app_admin
  using (true) with check (true);

-- ----- users ----------------------------------------------------------------
alter table users enable row level security;
alter table users force row level security;

drop policy if exists users_tenant_isolation on users;
create policy users_tenant_isolation on users
  for all to app_user
  using (tenant_id = current_setting('app.current_tenant', true)::uuid)
  with check (tenant_id = current_setting('app.current_tenant', true)::uuid);

drop policy if exists users_admin_all on users;
create policy users_admin_all on users
  for all to app_admin
  using (true) with check (true);

-- ----- patients -------------------------------------------------------------
alter table patients enable row level security;
alter table patients force row level security;

drop policy if exists patients_tenant_isolation on patients;
create policy patients_tenant_isolation on patients
  for all to app_user
  using (tenant_id = current_setting('app.current_tenant', true)::uuid)
  with check (tenant_id = current_setting('app.current_tenant', true)::uuid);

drop policy if exists patients_admin_all on patients;
create policy patients_admin_all on patients
  for all to app_admin
  using (true) with check (true);

-- ----- conversations --------------------------------------------------------
alter table conversations enable row level security;
alter table conversations force row level security;

drop policy if exists conversations_tenant_isolation on conversations;
create policy conversations_tenant_isolation on conversations
  for all to app_user
  using (tenant_id = current_setting('app.current_tenant', true)::uuid)
  with check (tenant_id = current_setting('app.current_tenant', true)::uuid);

drop policy if exists conversations_admin_all on conversations;
create policy conversations_admin_all on conversations
  for all to app_admin
  using (true) with check (true);

-- ----- messages -------------------------------------------------------------
alter table messages enable row level security;
alter table messages force row level security;

drop policy if exists messages_tenant_isolation on messages;
create policy messages_tenant_isolation on messages
  for all to app_user
  using (tenant_id = current_setting('app.current_tenant', true)::uuid)
  with check (tenant_id = current_setting('app.current_tenant', true)::uuid);

drop policy if exists messages_admin_all on messages;
create policy messages_admin_all on messages
  for all to app_admin
  using (true) with check (true);

-- ----- csv_imports ----------------------------------------------------------
alter table csv_imports enable row level security;
alter table csv_imports force row level security;

drop policy if exists csv_imports_tenant_isolation on csv_imports;
create policy csv_imports_tenant_isolation on csv_imports
  for all to app_user
  using (tenant_id = current_setting('app.current_tenant', true)::uuid)
  with check (tenant_id = current_setting('app.current_tenant', true)::uuid);

drop policy if exists csv_imports_admin_all on csv_imports;
create policy csv_imports_admin_all on csv_imports
  for all to app_admin
  using (true) with check (true);

-- ----- admin_users + admin_audit_log ---------------------------------------
-- These are admin-only tables. app_user has no policy → cannot read or write.
alter table admin_users enable row level security;
alter table admin_users force row level security;
drop policy if exists admin_users_admin_all on admin_users;
create policy admin_users_admin_all on admin_users
  for all to app_admin using (true) with check (true);

alter table admin_audit_log enable row level security;
alter table admin_audit_log force row level security;
drop policy if exists admin_audit_log_admin_all on admin_audit_log;
create policy admin_audit_log_admin_all on admin_audit_log
  for all to app_admin using (true) with check (true);
