import { and, count, desc, eq, gt, sql } from 'drizzle-orm';
import Link from 'next/link';

import { adminAuditLog, adminUsers, csvImports, db, messages, patients, tenants } from '@/lib/db';
import { logAdminAction } from '@/lib/audit';
import { formatTimestamp } from '@/lib/format';

export const dynamic = 'force-dynamic';

const SEVEN_DAYS_AGO = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

export default async function DashboardPage() {
  await logAdminAction({ action: 'view_dashboard' });

  const sevenDaysAgo = SEVEN_DAYS_AGO();

  const [
    [tenantCount],
    [patientCount],
    [outboundCount],
    [revenueRow],
    allTenants,
    failedByTenant,
    csvErrorsByTenant,
    recentAudit,
  ] = await Promise.all([
    db.select({ n: count() }).from(tenants),
    db.select({ n: count() }).from(patients),
    db
      .select({ n: count() })
      .from(messages)
      .where(and(eq(messages.direction, 'outbound'), gt(messages.createdAt, sevenDaysAgo))),
    db
      .select({
        cents: sql<number>`coalesce(sum(${patients.estimatedRevenueCents}) filter (where ${patients.converted} = true), 0)::int`,
      })
      .from(patients),
    db
      .select({ id: tenants.id, name: tenants.name, twilioFromNumber: tenants.twilioFromNumber })
      .from(tenants)
      .orderBy(desc(tenants.createdAt)),
    db
      .select({ tenantId: messages.tenantId, n: count() })
      .from(messages)
      .where(and(eq(messages.status, 'failed'), gt(messages.createdAt, sevenDaysAgo)))
      .groupBy(messages.tenantId),
    db
      .select({ tenantId: csvImports.tenantId, n: count() })
      .from(csvImports)
      .where(and(gt(csvImports.skippedCount, 0), gt(csvImports.createdAt, sevenDaysAgo)))
      .groupBy(csvImports.tenantId),
    db
      .select({
        id: adminAuditLog.id,
        action: adminAuditLog.action,
        resource: adminAuditLog.resource,
        createdAt: adminAuditLog.createdAt,
        adminEmail: adminUsers.email,
        tenantName: tenants.name,
      })
      .from(adminAuditLog)
      .leftJoin(adminUsers, eq(adminAuditLog.adminUserId, adminUsers.id))
      .leftJoin(tenants, eq(adminAuditLog.tenantIdAccessed, tenants.id))
      .orderBy(desc(adminAuditLog.createdAt))
      .limit(10),
  ]);

  const failedMap = new Map(failedByTenant.map((r) => [r.tenantId, r.n]));
  const csvErrorMap = new Map(csvErrorsByTenant.map((r) => [r.tenantId, r.n]));

  const tenantsNeedingAttention = allTenants
    .map((t) => {
      const reasons: string[] = [];
      if (!t.twilioFromNumber) reasons.push('No Twilio number');
      const failed = failedMap.get(t.id);
      if (failed) reasons.push(`${failed} failed message${failed === 1 ? '' : 's'} (7d)`);
      const csvErrors = csvErrorMap.get(t.id);
      if (csvErrors) reasons.push(`${csvErrors} CSV import${csvErrors === 1 ? '' : 's'} with errors (7d)`);
      return { id: t.id, name: t.name, reasons };
    })
    .filter((t) => t.reasons.length > 0)
    .sort((a, b) => b.reasons.length - a.reasons.length);

  const withNumber = allTenants.filter((t) => t.twilioFromNumber).length;
  const totalTenants = tenantCount?.n ?? 0;
  const revenue = (revenueRow?.cents ?? 0) / 100;

  return (
    <>
      <div className="header-row">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">Platform-wide overview across all tenants</div>
        </div>
      </div>

      <div className="kpi-grid">
        <Kpi label="Total tenants" value={totalTenants} />
        <Kpi label="Total patients" value={patientCount?.n ?? 0} />
        <Kpi label="Messages sent (7d)" value={outboundCount?.n ?? 0} />
        <Kpi
          label="Revenue recovered"
          value={new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
          }).format(revenue)}
        />
      </div>

      <div className="split">
        <div className="card">
          <div className="card-header">
            Tenants needing attention
            <span className={`chip ${tenantsNeedingAttention.length > 0 ? 'warning' : 'success'}`}>
              {tenantsNeedingAttention.length}
            </span>
          </div>
          <div className="card-body">
            {tenantsNeedingAttention.length === 0 ? (
              <div className="empty">All tenants healthy.</div>
            ) : (
              tenantsNeedingAttention.map((t) => (
                <div className="list-row" key={t.id}>
                  <Link href={`/tenants/${t.id}`} style={{ fontWeight: 500, fontSize: 13 }}>
                    {t.name}
                  </Link>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {t.reasons.map((r, i) => (
                      <span className="chip warning" key={i}>
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            Twilio coverage
            <span className="chip">
              {withNumber} / {totalTenants}
            </span>
          </div>
          <div className="card-body">
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
              {withNumber} of {totalTenants} tenant{totalTenants === 1 ? '' : 's'} have a Twilio
              number assigned. Assign numbers from a tenant&apos;s detail page.
            </p>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">Recent activity</div>
        {recentAudit.length === 0 ? (
          <div className="empty">No activity yet.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Tenant</th>
              </tr>
            </thead>
            <tbody>
              {recentAudit.map((r) => (
                <tr key={r.id}>
                  <td className="mono" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                    {formatTimestamp(r.createdAt)}
                  </td>
                  <td>{r.adminEmail}</td>
                  <td>
                    <code style={{ fontSize: 12 }}>{r.action}</code>
                  </td>
                  <td>{r.tenantName ?? <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function Kpi({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
    </div>
  );
}
