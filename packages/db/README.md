# @aura/db

Shared Drizzle schema, tenant-scoped DB helpers, and migration tooling for AURA.

## What's in here

```
src/
  schema.ts      All 8 tables (tenants, users, patients, conversations,
                 messages, csv_imports, admin_users, admin_audit_log)
  client.ts     createDb(connectionString) → typed Drizzle client
  withTenant.ts  Wraps a callback in a tx with app.current_tenant set;
                 every RLS-protected query inside only sees that tenant's rows
  index.ts       Public exports

sql/
  01-roles.sql   Grants + default privileges for app_user / app_admin
  02-rls.sql     Enable RLS + policies for every tenant-scoped table
  03-dev-tenant.sql  Idempotent seed: 2 dev tenants + 4 patients

scripts/
  setup-roles.ts  Creates the two roles, applies grants + RLS,
                  prints app-scoped connection strings
  seed-dev.ts     Runs sql/03-dev-tenant.sql
  verify-rls.ts   End-to-end isolation test
```

## One-time setup

1. Copy `.env.example` to `.env` and fill in `NEON_OWNER_URL`.
2. Generate the schema and push it to Neon:
   ```bash
   pnpm db:generate    # writes drizzle/0000_*.sql from the TS schema
   pnpm db:push        # applies it to the database
   ```
3. Create the two limited roles + apply RLS policies:
   ```bash
   pnpm db:setup-roles
   ```
   This prints two connection strings — `APP_USER_URL` and `APP_ADMIN_URL`.
   Save them to your scratch notes, paste them back into
   `packages/db/.env`, and (later) into each app's `.env.local`.
4. Seed two dev tenants for testing:
   ```bash
   pnpm db:seed
   ```
5. Verify tenant isolation:
   ```bash
   pnpm db:verify-rls
   ```
   Should print five ✓ checks.

## Day-to-day

- Schema changes: edit `src/schema.ts`, then `pnpm db:generate && pnpm db:push`.
- Inspect data: `pnpm db:studio`.
- New tenant for testing: append rows to `sql/03-dev-tenant.sql` and re-run `pnpm db:seed`.

## Multi-tenancy contract

Every app-code query against a tenant-scoped table **must** go through
`withTenant(db, tenantId, async (tx) => { ... })`. Direct queries
outside the helper either fail (no rows visible because RLS demands the
session var) or are an explicit, audited admin operation.
