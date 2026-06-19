import 'server-only';

import { adminAuditLog, adminUsers, type NewAdminAuditLog } from '@aura/db';
import { auth, currentUser } from '@clerk/nextjs/server';
import { eq, sql } from 'drizzle-orm';

import { db } from './db';

export type AuditAction =
  | 'view_tenant_list'
  | 'view_tenant'
  | 'view_patients'
  | 'view_audit_log'
  | 'impersonate_start'
  | 'impersonate_end'
  | 'export'
  | 'delete_tenant'
  | 'assign_twilio_number';

export type AuditOptions = {
  action: AuditAction;
  tenantIdAccessed?: string;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Records a row in admin_audit_log for the current admin user. Upserts the
 * admin_users row on first use so newly allowlisted admins don't need a
 * separate provisioning step.
 */
export async function logAdminAction(opts: AuditOptions): Promise<void> {
  const { userId } = await auth();
  if (!userId) return; // Not signed in — middleware should have caught this.

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? null;
  const fullName = user?.fullName ?? null;

  // Upsert the admin_users row keyed on clerk_user_id.
  const upserted = await db
    .insert(adminUsers)
    .values({
      clerkUserId: userId,
      email: email ?? 'unknown@admin',
      fullName: fullName ?? null,
      role: 'admin',
    })
    .onConflictDoUpdate({
      target: adminUsers.clerkUserId,
      set: {
        email: sql`excluded.email`,
        fullName: sql`excluded.full_name`,
      },
    })
    .returning({ id: adminUsers.id });

  const adminUserId = upserted[0]?.id;
  if (!adminUserId) return;

  const row: NewAdminAuditLog = {
    adminUserId,
    tenantIdAccessed: opts.tenantIdAccessed ?? null,
    action: opts.action,
    resource: opts.resource ?? null,
    resourceId: opts.resourceId ?? null,
    metadata: opts.metadata ?? {},
  };
  await db.insert(adminAuditLog).values(row);
}

export async function getCurrentAdminId(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const rows = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.clerkUserId, userId))
    .limit(1);
  return rows[0]?.id ?? null;
}
