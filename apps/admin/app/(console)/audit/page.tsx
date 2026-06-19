import { desc, eq } from 'drizzle-orm';

import { adminAuditLog, adminUsers, db, tenants } from '@/lib/db';
import { logAdminAction } from '@/lib/audit';
import { formatTimestamp } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AuditPage() {
  await logAdminAction({ action: 'view_audit_log' });

  const rows = await db
    .select({
      id: adminAuditLog.id,
      action: adminAuditLog.action,
      resource: adminAuditLog.resource,
      resourceId: adminAuditLog.resourceId,
      createdAt: adminAuditLog.createdAt,
      adminEmail: adminUsers.email,
      tenantName: tenants.name,
      tenantId: adminAuditLog.tenantIdAccessed,
    })
    .from(adminAuditLog)
    .leftJoin(adminUsers, eq(adminAuditLog.adminUserId, adminUsers.id))
    .leftJoin(tenants, eq(adminAuditLog.tenantIdAccessed, tenants.id))
    .orderBy(desc(adminAuditLog.createdAt))
    .limit(200);

  return (
    <>
      <div className="header-row">
        <div>
          <div className="page-title">Audit log</div>
          <div className="page-sub">{rows.length} most recent admin actions</div>
        </div>
      </div>

      <div className="card">
        {rows.length === 0 ? (
          <div className="empty">No audit entries yet.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Tenant</th>
                <th>Resource</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="mono" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                    {formatTimestamp(r.createdAt)}
                  </td>
                  <td>{r.adminEmail}</td>
                  <td>
                    <code style={{ fontSize: 12 }}>{r.action}</code>
                  </td>
                  <td>{r.tenantName ?? <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                  <td className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {r.resource}
                    {r.resourceId ? ` / ${r.resourceId.slice(0, 8)}…` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
