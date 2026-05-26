'use server';

import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { adminAuditLog, db, tenants } from '@/lib/db';
import { logAdminAction } from '@/lib/audit';

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
