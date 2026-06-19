import { desc, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

import { conversations, csvImports, db, patients, tenants } from '@/lib/db';
import { logAdminAction } from '@/lib/audit';
import { formatDate, formatTimestamp } from '@/lib/format';

import { EndViewButton } from './EndViewButton';

export const dynamic = 'force-dynamic';

export default async function TenantViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const tenant = (await db.select().from(tenants).where(eq(tenants.id, id)).limit(1))[0];
  if (!tenant) notFound();

  await logAdminAction({
    action: 'impersonate_start',
    tenantIdAccessed: tenant.id,
    resource: 'tenant',
    resourceId: tenant.id,
  });

  const [patientRows, conversationRows, importRows] = await Promise.all([
    db
      .select({
        id: patients.id,
        firstName: patients.firstName,
        lastName: patients.lastName,
        phone: patients.phone,
        email: patients.email,
        status: patients.status,
        converted: patients.converted,
        optedOut: patients.optedOut,
        source: patients.source,
        createdAt: patients.createdAt,
      })
      .from(patients)
      .where(eq(patients.tenantId, id))
      .orderBy(desc(patients.createdAt))
      .limit(100),
    db
      .select({
        id: conversations.id,
        patientFirstName: patients.firstName,
        patientLastName: patients.lastName,
        patientPhone: patients.phone,
        lastActivityAt: conversations.lastActivityAt,
        lastMessagePreview: conversations.lastMessagePreview,
        lastMessageDirection: conversations.lastMessageDirection,
        unreadCount: conversations.unreadCount,
      })
      .from(conversations)
      .innerJoin(patients, eq(conversations.patientId, patients.id))
      .where(eq(conversations.tenantId, id))
      .orderBy(desc(conversations.lastActivityAt))
      .limit(50),
    db
      .select({
        id: csvImports.id,
        filename: csvImports.filename,
        totalRows: csvImports.totalRows,
        importedCount: csvImports.importedCount,
        skippedCount: csvImports.skippedCount,
        status: csvImports.status,
        createdAt: csvImports.createdAt,
      })
      .from(csvImports)
      .where(eq(csvImports.tenantId, id))
      .orderBy(desc(csvImports.createdAt))
      .limit(20),
  ]);

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--accent-soft)',
          border: '1px solid var(--accent)',
          borderRadius: 'var(--radius)',
          padding: '10px 16px',
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--accent-strong)' }}>
          Viewing {tenant.name} — read-only
        </span>
        <EndViewButton tenantId={tenant.id} />
      </div>

      <div className="header-row">
        <div>
          <div className="page-title">{tenant.name}</div>
          <div className="page-sub">
            {patientRows.length} patients · {conversationRows.length} conversations ·{' '}
            {importRows.length} imports
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Conversations</div>
        {conversationRows.length === 0 ? (
          <div className="empty">No conversations yet.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Phone</th>
                <th>Last activity</th>
                <th>Last message</th>
                <th style={{ textAlign: 'right' }}>Unread</th>
              </tr>
            </thead>
            <tbody>
              {conversationRows.map((c) => (
                <tr key={c.id}>
                  <td>{[c.patientFirstName, c.patientLastName].filter(Boolean).join(' ') || '—'}</td>
                  <td className="mono" style={{ fontSize: 12 }}>
                    {c.patientPhone ?? '—'}
                  </td>
                  <td className="mono" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                    {formatTimestamp(c.lastActivityAt)}
                  </td>
                  <td style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.lastMessageDirection === 'outbound' ? 'You: ' : ''}
                    {c.lastMessagePreview ?? '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {c.unreadCount > 0 ? (
                      <span className="chip warning">{c.unreadCount}</span>
                    ) : (
                      <span style={{ color: 'var(--muted)' }}>0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">Patients</div>
        {patientRows.length === 0 ? (
          <div className="empty">No patients yet.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Source</th>
                <th>Added</th>
              </tr>
            </thead>
            <tbody>
              {patientRows.map((p) => (
                <tr key={p.id}>
                  <td>{[p.firstName, p.lastName].filter(Boolean).join(' ') || '—'}</td>
                  <td className="mono" style={{ fontSize: 12 }}>
                    {p.phone ?? '—'}
                  </td>
                  <td>
                    <span
                      className={`chip ${p.converted ? 'success' : p.optedOut ? 'danger' : ''}`}
                    >
                      {p.optedOut ? 'opted_out' : p.status}
                    </span>
                  </td>
                  <td>{p.source}</td>
                  <td className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {formatDate(p.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">CSV imports</div>
        {importRows.length === 0 ? (
          <div className="empty">No imports yet.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Filename</th>
                <th style={{ textAlign: 'right' }}>Total rows</th>
                <th style={{ textAlign: 'right' }}>Imported</th>
                <th style={{ textAlign: 'right' }}>Skipped</th>
                <th>Status</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {importRows.map((i) => (
                <tr key={i.id}>
                  <td>{i.filename}</td>
                  <td className="mono" style={{ textAlign: 'right' }}>
                    {i.totalRows}
                  </td>
                  <td className="mono" style={{ textAlign: 'right' }}>
                    {i.importedCount}
                  </td>
                  <td className="mono" style={{ textAlign: 'right' }}>
                    {i.skippedCount}
                  </td>
                  <td>
                    <span className={`chip ${i.status === 'complete' ? 'success' : i.status === 'failed' ? 'danger' : ''}`}>
                      {i.status}
                    </span>
                  </td>
                  <td className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {formatTimestamp(i.createdAt)}
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
