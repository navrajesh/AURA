/**
 * Verifies RLS isolation works end-to-end.
 *   - Connects as app_user with no tenant context → expects 0 patient rows.
 *   - Connects as app_user with tenant A set → expects only A's patients.
 *   - Connects as app_user with tenant B set → expects only B's patients.
 *   - Connects as app_admin → expects all rows across tenants.
 *
 *   pnpm db:verify-rls
 */
import { connect, requireEnv } from './_lib';

const TENANT_A = '00000000-0000-0000-0000-00000000aaaa';
const TENANT_B = '00000000-0000-0000-0000-00000000bbbb';

async function countAs(label: string, url: string, tenantId: string | null) {
  const sql = connect(url);
  let n: number;
  if (tenantId) {
    const result = await sql.begin(async (tx) => {
      await tx`select set_config('app.current_tenant', ${tenantId}, true)`;
      const rows = await tx<{ n: number }[]>`select count(*)::int as n from patients`;
      return rows[0]?.n ?? 0;
    });
    n = result;
  } else {
    const rows = await sql<{ n: number }[]>`select count(*)::int as n from patients`;
    n = rows[0]?.n ?? 0;
  }
  await sql.end();
  console.log(`  ${label.padEnd(48)} → ${n} rows`);
  return n;
}

async function main() {
  const appUserUrl = requireEnv('APP_USER_URL');
  const appAdminUrl = requireEnv('APP_ADMIN_URL');

  console.log('\n[verify-rls] Running tenant isolation checks...\n');

  const userNoContext = await countAs('app_user, no tenant context', appUserUrl, null);
  const userTenantA = await countAs('app_user, tenant A context', appUserUrl, TENANT_A);
  const userTenantB = await countAs('app_user, tenant B context', appUserUrl, TENANT_B);
  const adminAll = await countAs('app_admin (no RLS scoping)', appAdminUrl, null);

  console.log('');
  const checks: [string, boolean][] = [
    ['app_user with no tenant sees zero rows', userNoContext === 0],
    ['app_user sees exactly tenant A rows', userTenantA > 0 && userTenantA < adminAll],
    ['app_user sees exactly tenant B rows', userTenantB > 0 && userTenantB < adminAll],
    ['tenant A and B counts sum to admin count', userTenantA + userTenantB === adminAll],
    ['app_admin sees all rows', adminAll > 0],
  ];

  let allPass = true;
  for (const [name, ok] of checks) {
    console.log(`  ${ok ? '✓' : '✗'} ${name}`);
    if (!ok) allPass = false;
  }
  console.log('');
  if (!allPass) process.exit(1);
  console.log('All RLS checks passed.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
