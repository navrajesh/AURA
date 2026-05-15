import 'server-only';

import { auth, clerkClient } from '@clerk/nextjs/server';

export type CurrentContext = {
  userId: string;
  orgId: string;
  tenantId: string;
  tenantName: string;
};

/**
 * Resolves the current tenant from Clerk auth.
 *
 * The Clerk webhook (POST /api/clerk/webhook) inserts the local `tenants`
 * row on `organization.created` and stores the resulting uuid in the org's
 * `publicMetadata.aura_tenant_id`. App code reads it from there, avoiding
 * a DB lookup that would hit the RLS bootstrap problem (no `app.current_tenant`
 * to set yet).
 *
 * On the first request after a brand-new org sign-up the webhook may not have
 * landed yet; we surface that as a clean error so the page can show a "Setting
 * up your account..." state instead of crashing.
 */
export async function requireCurrentContext(): Promise<CurrentContext> {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error('Not authenticated');
  if (!orgId) throw new Error('No organization selected');

  const client = await clerkClient();
  const org = await client.organizations.getOrganization({ organizationId: orgId });
  const tenantId = org.publicMetadata?.aura_tenant_id as string | undefined;

  if (!tenantId) {
    throw new TenantNotReadyError(
      `Tenant for org ${orgId} not provisioned yet — Clerk webhook may still be in flight.`,
    );
  }

  return {
    userId,
    orgId,
    tenantId,
    tenantName: org.name,
  };
}

export class TenantNotReadyError extends Error {
  readonly code = 'TENANT_NOT_READY' as const;
}
