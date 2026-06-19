import { count, desc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { csvImports, db, messages, patients, tenants } from '@/lib/db';
import { logAdminAction } from '@/lib/audit';
import { Timestamp } from '@/components/Timestamp';
import { AssignTwilioButton } from './AssignTwilioButton';
import { DeleteTenantButton } from './DeleteTenantButton';
import { SuspendTenantButton } from './SuspendTenantButton';

export const dynamic = 'force-dynamic';

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const tenant = (await db.select().from(tenants).where(eq(tenants.id, id)).limit(1))[0];
  if (!tenant) notFound();

  await logAdminAction({
    action: 'view_tenant',
    tenantIdAccessed: tenant.id,
    resource: 'tenant',
    resourceId: tenant.id,
  });

  const [pc] = await db.select({ n: count() }).from(patients).where(eq(patients.tenantId, id));
  const [mc] = await db.select({ n: count() }).from(messages).where(eq(messages.tenantId, id));
  const [ic] = await db.select({ n: count() }).from(csvImports).where(eq(csvImports.tenantId, id));

  const recentMessages = await db
    .select({
      id: messages.id,
      direction: messages.direction,
      channel: messages.channel,
      bodyText: messages.bodyText,
      status: messages.status,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(eq(messages.tenantId, id))
    .orderBy(desc(messages.createdAt))
    .limit(20);

  return (
    <>
      <div className="header-row">
        <div>
          <div className="page-title">{tenant.name}</div>
          <div className="page-sub mono">{tenant.clerkOrgId}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className={`chip ${tenant.status === 'active' ? 'success' : 'danger'}`}>
            {tenant.status}
          </span>
          <Link
            href={`/tenants/${tenant.id}/view`}
            style={{
              padding: '6px 14px',
              background: 'var(--accent)',
              color: 'var(--bg)',
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 13,
              textDecoration: 'none',
            }}
          >
            View as tenant
          </Link>
          <SuspendTenantButton
            tenantId={tenant.id}
            tenantName={tenant.name}
            status={tenant.status}
          />
          <DeleteTenantButton tenantId={tenant.id} tenantName={tenant.name} />
        </div>
      </div>

      <div className="kpi-grid">
        <Kpi label="Patients" value={pc!.n} />
        <Kpi label="Messages" value={mc!.n} />
        <Kpi label="CSV imports" value={ic!.n} />
        <div className="kpi">
          <div className="kpi-label">Twilio number</div>
          <div className="kpi-value" style={{ fontSize: 16 }}>
            <AssignTwilioButton tenantId={tenant.id} currentNumber={tenant.twilioFromNumber} />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
          Recent messages
        </div>
        {recentMessages.length === 0 ? (
          <div className="empty">No messages yet.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Dir</th>
                <th>Channel</th>
                <th>Body</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentMessages.map((m) => (
                <tr key={m.id}>
                  <td className="mono" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                    <Timestamp value={m.createdAt} />
                  </td>
                  <td>{m.direction}</td>
                  <td>{m.channel}</td>
                  <td style={{ maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.bodyText}
                  </td>
                  <td>{m.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function Kpi({ label, value, mono }: { label: string; value: number | string; mono?: boolean }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className={`kpi-value ${mono ? 'mono' : ''}`}>{value}</div>
    </div>
  );
}
