import { count, desc, eq, sql } from 'drizzle-orm';
import Link from 'next/link';
import { Suspense } from 'react';

import { csvImports, db, messages, patients, tenants } from '@/lib/db';
import { logAdminAction } from '@/lib/audit';
import { Timestamp } from '@/components/Timestamp';

import { DeletedToastBridge } from './DeletedToastBridge';

export const dynamic = 'force-dynamic';

export default async function TenantsPage() {
  await logAdminAction({ action: 'view_tenant_list' });

  const rows = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      clerkOrgId: tenants.clerkOrgId,
      status: tenants.status,
      twilioFromNumber: tenants.twilioFromNumber,
      createdAt: tenants.createdAt,
      patientCount: sql<number>`(select count(*)::int from ${patients} where ${patients.tenantId} = ${tenants.id})`,
      messageCount: sql<number>`(select count(*)::int from ${messages} where ${messages.tenantId} = ${tenants.id})`,
      importCount: sql<number>`(select count(*)::int from ${csvImports} where ${csvImports.tenantId} = ${tenants.id})`,
    })
    .from(tenants)
    .orderBy(desc(tenants.createdAt));

  void count;
  void eq;

  return (
    <>
      <Suspense fallback={null}>
        <DeletedToastBridge />
      </Suspense>
      <div className="header-row">
        <div>
          <div className="page-title">Tenants</div>
          <div className="page-sub">{rows.length} active workspace{rows.length === 1 ? '' : 's'}</div>
        </div>
      </div>

      <div className="card">
        {rows.length === 0 ? (
          <div className="empty">No tenants yet.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Twilio</th>
                <th style={{ textAlign: 'right' }}>Patients</th>
                <th style={{ textAlign: 'right' }}>Messages</th>
                <th style={{ textAlign: 'right' }}>Imports</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link href={`/tenants/${t.id}`} style={{ fontWeight: 500 }}>
                      {t.name}
                    </Link>
                    <div className="mono" style={{ color: 'var(--muted)', fontSize: 11 }}>
                      {t.clerkOrgId}
                    </div>
                  </td>
                  <td>
                    <span className={`chip ${t.status === 'active' ? 'success' : 'danger'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="mono" style={{ fontSize: 12 }}>
                    {t.twilioFromNumber ?? <span style={{ color: 'var(--muted)' }}>—</span>}
                  </td>
                  <td className="mono" style={{ textAlign: 'right' }}>
                    {t.patientCount}
                  </td>
                  <td className="mono" style={{ textAlign: 'right' }}>
                    {t.messageCount}
                  </td>
                  <td className="mono" style={{ textAlign: 'right' }}>
                    {t.importCount}
                  </td>
                  <td className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>
                    <Timestamp value={t.createdAt} dateOnly />
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
