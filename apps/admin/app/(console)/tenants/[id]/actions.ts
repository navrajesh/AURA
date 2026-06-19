'use server';

import { and, eq, ne } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { adminAuditLog, db, tenants } from '@/lib/db';
import { logAdminAction } from '@/lib/audit';

const E164_RE = /^\+\d{10,15}$/;

export type AssignTwilioResult = { ok: true } | { ok: false; message: string };

export async function assignTwilioNumber(
  tenantId: string,
  rawNumber: string,
): Promise<AssignTwilioResult> {
  const number = rawNumber.trim();
  if (!E164_RE.test(number)) {
    return { ok: false, message: `Phone must be E.164 (e.g. +15551234567). Got: ${number}` };
  }

  const conflict = (
    await db
      .select({ id: tenants.id, name: tenants.name })
      .from(tenants)
      .where(and(eq(tenants.twilioFromNumber, number), ne(tenants.id, tenantId)))
      .limit(1)
  )[0];
  if (conflict) {
    return {
      ok: false,
      message: `${number} is already assigned to tenant "${conflict.name}". Each number can only belong to one tenant.`,
    };
  }

  const updated = (
    await db
      .update(tenants)
      .set({ twilioFromNumber: number, updatedAt: new Date() })
      .where(eq(tenants.id, tenantId))
      .returning({ id: tenants.id, name: tenants.name })
  )[0];
  if (!updated) {
    return { ok: false, message: 'Tenant not found.' };
  }

  await logAdminAction({
    action: 'assign_twilio_number',
    tenantIdAccessed: tenantId,
    resource: 'tenant',
    resourceId: tenantId,
    metadata: { number },
  });

  return { ok: true };
}

export async function deleteTenant(tenantId: string, tenantName: string) {
  // Null out audit log FK references — tenantIdAccessed has no ON DELETE CASCADE.
  await db
    .update(adminAuditLog)
    .set({ tenantIdAccessed: null })
    .where(eq(adminAuditLog.tenantIdAccessed, tenantId));

  // Delete the tenant — cascades users, patients, conversations, messages, csv_imports.
  await db.delete(tenants).where(eq(tenants.id, tenantId));

  await logAdminAction({
    action: 'delete_tenant',
    metadata: { deletedTenantId: tenantId, deletedTenantName: tenantName },
  });

  redirect('/tenants');
}
