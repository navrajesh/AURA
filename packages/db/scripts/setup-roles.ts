/**
 * Creates the app_user and app_admin Postgres roles, grants table privileges,
 * and applies all RLS policies. Prints the two role-scoped connection strings
 * that go into apps/app/.env and apps/admin/.env.
 *
 * Idempotent — safe to re-run.
 *
 *   pnpm db:setup-roles
 */
import { connect, generatePassword, readSql, requireEnv, rewriteConnectionUrl } from './_lib';

/**
 * Postgres won't accept a parameterised password inside CREATE ROLE / ALTER
 * ROLE — those are DDL statements that require literal tokens. We generate
 * the password ourselves, then build the statement with the value inlined,
 * quoted as a SQL string literal. Single quotes inside the password are
 * doubled per SQL escaping. The alphabet in generatePassword() doesn't emit
 * quotes, but we escape defensively in case a user-supplied APP_*_PASSWORD
 * contains one.
 */
function quote(s: string): string {
  return `'${s.replace(/'/g, "''")}'`;
}

async function main() {
  const ownerUrl = requireEnv('NEON_OWNER_URL');

  const appUserPassword = process.env.APP_USER_PASSWORD || generatePassword();
  const appAdminPassword = process.env.APP_ADMIN_PASSWORD || generatePassword();

  const sql = connect(ownerUrl);

  console.log('[setup-roles] Creating roles app_user and app_admin...');
  await sql.unsafe(`
    do $$ begin
      if not exists (select 1 from pg_roles where rolname = 'app_user') then
        create role app_user with login password ${quote(appUserPassword)};
      else
        alter role app_user with password ${quote(appUserPassword)};
      end if;
    end $$;
  `);
  await sql.unsafe(`
    do $$ begin
      if not exists (select 1 from pg_roles where rolname = 'app_admin') then
        create role app_admin with login password ${quote(appAdminPassword)};
      else
        alter role app_admin with password ${quote(appAdminPassword)};
      end if;
    end $$;
  `);

  console.log('[setup-roles] Applying grants...');
  await sql.unsafe(readSql('sql/01-roles.sql'));

  console.log('[setup-roles] Applying RLS policies...');
  await sql.unsafe(readSql('sql/02-rls.sql'));

  await sql.end();

  const appUserUrl = rewriteConnectionUrl(ownerUrl, 'app_user', appUserPassword);
  const appAdminUrl = rewriteConnectionUrl(ownerUrl, 'app_admin', appAdminPassword);

  console.log('\n✓ Roles created and RLS applied.\n');
  console.log('Add these to your scratch notes and the corresponding app .env files:');
  console.log('─────────────────────────────────────────────────────────────────────');
  console.log(`APP_USER_URL=${appUserUrl}`);
  console.log(`APP_ADMIN_URL=${appAdminUrl}`);
  console.log('─────────────────────────────────────────────────────────────────────');
  console.log('\nAlso paste the same values into packages/db/.env so verify-rls can use them.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
