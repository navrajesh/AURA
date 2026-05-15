import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';

import { createDb, tenants, users, type NewTenant, type NewUser } from '@aura/db';
import { clerkClient } from '@clerk/nextjs/server';
import { eq, sql } from 'drizzle-orm';

import { env } from '@/lib/env';

/**
 * Clerk → AURA sync.
 *
 *   organization.created          → INSERT tenants, stamp aura_tenant_id in org publicMetadata
 *   organizationMembership.created → INSERT users (looks up tenant via org publicMetadata)
 *   user.created                  → no-op (users get inserted via membership)
 *
 * Verified with the svix signing secret (CLERK_WEBHOOK_SECRET). Uses the
 * Neon owner connection (DATABASE_OWNER_URL) because the webhook needs to
 * write tenants + users without an established RLS tenant context.
 */

type ClerkOrg = {
  id: string;
  name: string;
  public_metadata?: Record<string, unknown>;
};

type ClerkMembership = {
  id: string;
  organization: ClerkOrg;
  public_user_data: {
    user_id: string;
    identifier: string;
    first_name?: string | null;
    last_name?: string | null;
  };
  role: string;
};

type ClerkUser = {
  id: string;
};

type ClerkEvent =
  | { type: 'organization.created'; data: ClerkOrg }
  | { type: 'organization.updated'; data: ClerkOrg }
  | { type: 'organizationMembership.created'; data: ClerkMembership }
  | { type: 'user.created'; data: ClerkUser }
  | { type: string; data: unknown };

const ownerUrl =
  process.env.DATABASE_OWNER_URL ??
  // Allow falling back to DATABASE_URL only if it's the owner role — dev convenience.
  '';

if (!ownerUrl) {
  throw new Error(
    'Clerk webhook requires DATABASE_OWNER_URL (Neon owner connection string). ' +
      'Add it to apps/app/.env.local.',
  );
}

// Webhook handler runs with full DB privileges; uses its own client so it
// doesn't share the app_user pool.
const ownerDb = createDb(ownerUrl);

export async function POST(req: Request) {
  const hdrs = await headers();
  const svixId = hdrs.get('svix-id');
  const svixTimestamp = hdrs.get('svix-timestamp');
  const svixSignature = hdrs.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new NextResponse('Missing svix headers', { status: 400 });
  }

  const body = await req.text();
  let event: ClerkEvent;
  try {
    const wh = new Webhook(env.CLERK_WEBHOOK_SECRET);
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkEvent;
  } catch (err) {
    console.error('[clerk-webhook] signature verification failed', err);
    return new NextResponse('Invalid signature', { status: 403 });
  }

  try {
    switch (event.type) {
      case 'organization.created':
      case 'organization.updated':
        await handleOrg(event.data as ClerkOrg);
        break;
      case 'organizationMembership.created':
        await handleMembership(event.data as ClerkMembership);
        break;
      case 'user.created':
        // No-op: users are created via membership events that carry tenant context.
        break;
      default:
        console.log(`[clerk-webhook] unhandled event: ${event.type}`);
    }
  } catch (err) {
    console.error('[clerk-webhook] handler error', err);
    return new NextResponse('Handler error', { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

async function handleOrg(org: ClerkOrg) {
  // Idempotent upsert — re-running on org.updated is fine.
  const existing = await ownerDb
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.clerkOrgId, org.id))
    .limit(1);

  let tenantId: string;
  if (existing[0]) {
    tenantId = existing[0].id;
    await ownerDb
      .update(tenants)
      .set({ name: org.name, updatedAt: new Date() })
      .where(eq(tenants.id, tenantId));
  } else {
    const row: NewTenant = { clerkOrgId: org.id, name: org.name };
    const inserted = await ownerDb
      .insert(tenants)
      .values(row)
      .returning({ id: tenants.id });
    tenantId = inserted[0]!.id;
  }

  // Stamp the local tenant uuid into the Clerk org's publicMetadata so app
  // pages can read it from auth context without a DB lookup.
  const existingMeta = (org.public_metadata ?? {}) as Record<string, unknown>;
  if (existingMeta.aura_tenant_id !== tenantId) {
    const client = await clerkClient();
    await client.organizations.updateOrganization(org.id, {
      publicMetadata: { ...existingMeta, aura_tenant_id: tenantId },
    });
  }

  console.log(`[clerk-webhook] org synced: ${org.name} → tenants.id=${tenantId}`);
}

async function handleMembership(m: ClerkMembership) {
  // The membership event arrives with the org's current publicMetadata, but
  // the very first member of a brand-new org fires this event in the same
  // batch as organization.created — there's a race where aura_tenant_id may
  // not be stamped yet. Re-resolve via the live Clerk org fetch to be safe.
  const client = await clerkClient();
  const org = await client.organizations.getOrganization({ organizationId: m.organization.id });
  let tenantId = org.publicMetadata?.aura_tenant_id as string | undefined;

  if (!tenantId) {
    // Race: bootstrap the tenant inline, then continue.
    await handleOrg({
      id: org.id,
      name: org.name,
      public_metadata: org.publicMetadata as Record<string, unknown>,
    });
    const refreshed = await client.organizations.getOrganization({
      organizationId: m.organization.id,
    });
    tenantId = refreshed.publicMetadata?.aura_tenant_id as string | undefined;
    if (!tenantId) {
      throw new Error(`Could not resolve tenantId for org ${m.organization.id}`);
    }
  }

  const fullName =
    [m.public_user_data.first_name, m.public_user_data.last_name].filter(Boolean).join(' ') ||
    null;
  const row: NewUser = {
    clerkUserId: m.public_user_data.user_id,
    tenantId,
    email: m.public_user_data.identifier,
    fullName,
    role: m.role === 'org:admin' ? 'owner' : 'operator',
  };

  await ownerDb
    .insert(users)
    .values(row)
    .onConflictDoUpdate({
      target: users.clerkUserId,
      set: {
        email: sql`excluded.email`,
        fullName: sql`excluded.full_name`,
        tenantId: sql`excluded.tenant_id`,
        role: sql`excluded.role`,
        updatedAt: new Date(),
      },
    });

  console.log(
    `[clerk-webhook] user synced: ${row.email} → tenants.id=${tenantId} role=${row.role}`,
  );
}
