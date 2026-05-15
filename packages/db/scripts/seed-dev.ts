/**
 * Inserts two dev tenants (A and B) and a few patients each. Idempotent.
 *
 *   pnpm db:seed
 */
import { connect, readSql, requireEnv } from './_lib';

async function main() {
  const ownerUrl = requireEnv('NEON_OWNER_URL');
  const sql = connect(ownerUrl);

  console.log('[seed-dev] Seeding dev tenants and patients...');
  const seedSql = readSql('sql/03-dev-tenant.sql');
  await sql.unsafe(seedSql);

  const tenantCount = await sql<{ n: number }[]>`select count(*)::int as n from tenants`;
  const patientCount = await sql<{ n: number }[]>`select count(*)::int as n from patients`;
  await sql.end();

  console.log(
    `✓ Seed complete. tenants=${tenantCount[0]?.n ?? 0} patients=${patientCount[0]?.n ?? 0}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
