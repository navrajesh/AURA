/**
 * Assigns a Twilio phone number (E.164) to a tenant by Clerk org id.
 *
 *   pnpm --filter=@aura/db tsx scripts/assign-twilio-number.ts \
 *     org_2nABCxyz +15551234567
 *
 * Run after the partner delivers Twilio credentials so the inbox can
 * route inbound SMS to the right tenant.
 */
import { eq } from 'drizzle-orm';

import { tenants } from '@aura/db';

import { connect, requireEnv } from './_lib';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../src/schema';

async function main() {
  const [orgId, number] = process.argv.slice(2);
  if (!orgId || !number) {
    console.error('Usage: tsx scripts/assign-twilio-number.ts <clerk_org_id> <e164_phone>');
    process.exit(1);
  }
  if (!/^\+\d{10,15}$/.test(number)) {
    console.error(`Phone must be E.164 (e.g. +15551234567). Got: ${number}`);
    process.exit(1);
  }

  const sql = connect(requireEnv('NEON_OWNER_URL'));
  const db = drizzle(sql, { schema, casing: 'snake_case' });

  const updated = await db
    .update(tenants)
    .set({ twilioFromNumber: number, updatedAt: new Date() })
    .where(eq(tenants.clerkOrgId, orgId))
    .returning({ id: tenants.id, name: tenants.name });

  if (updated.length === 0) {
    console.error(`No tenant found for clerk_org_id=${orgId}`);
    process.exit(1);
  }
  await sql.end();
  console.log(`✓ Assigned ${number} to tenant ${updated[0]!.name} (${updated[0]!.id})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
