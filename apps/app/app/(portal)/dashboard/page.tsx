import { currentUser } from '@clerk/nextjs/server';
import { sql } from 'drizzle-orm';

import { patients, withTenant } from '@aura/db';

import { IconArrowUp, IconExternalNoop, RevenueHero } from './_widgets';
import { Sparkline } from '@/components/portal/Sparkline';
import { getDb } from '@/lib/db';
import { requireCurrentContext, TenantNotReadyError } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await currentUser();
  const greeting = user?.firstName ?? user?.username ?? 'there';

  let revenueData = { totalRevenueCents: 0, convertedCount: 0, totalPatients: 0 };
  try {
    const ctx = await requireCurrentContext();
    const [stats] = await withTenant(getDb(), ctx.tenantId, (tx) =>
      tx
        .select({
          totalRevenueCents: sql<number>`coalesce(sum(${patients.estimatedRevenueCents}) filter (where ${patients.converted} = true), 0)::int`,
          convertedCount: sql<number>`count(*) filter (where ${patients.converted} = true)`,
          totalPatients: sql<number>`count(*)`,
        })
        .from(patients),
    );
    if (stats) revenueData = stats;
  } catch (err) {
    if (!(err instanceof TenantNotReadyError)) throw err;
  }

  // Static placeholder KPIs — replaced with real queries when sequence engine is live.
  const kpis = [
    { label: 'Active patients', value: '0', trend: '—', spark: [1, 1, 1, 1, 1] },
    { label: 'Messages sent (7d)', value: '0', trend: '—', spark: [1, 1, 1, 1, 1] },
    { label: 'Reply rate', value: '—', trend: '—', spark: [1, 1, 1, 1, 1] },
    { label: 'Conversions (30d)', value: '0', trend: '—', spark: [1, 1, 1, 1, 1] },
  ];

  const funnel = [
    { label: 'Enrolled', n: 0, pct: 100 },
    { label: 'Day 1 sent', n: 0, pct: 0 },
    { label: 'Day 7 sent', n: 0, pct: 0 },
    { label: 'Replied', n: 0, pct: 0 },
    { label: 'Booked', n: 0, pct: 0 },
    { label: 'Converted', n: 0, pct: 0 },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Hello, {greeting}</h1>
          <p className="page-sub">
            Real metrics arrive once your first CSV imports and SMS sends go live.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn" type="button">
            Last 30 days
          </button>
          <button className="btn btn-primary" type="button">
            New campaign
          </button>
        </div>
      </div>

      <RevenueHero
        totalRevenueCents={revenueData.totalRevenueCents}
        convertedCount={revenueData.convertedCount}
        totalPatients={revenueData.totalPatients}
      />

      <div className="kpi-grid">
        {kpis.map((k) => (
          <div className="kpi" key={k.label}>
            <div className="kpi-label">
              <span>{k.label}</span>
            </div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-meta">
              <span className="kpi-trend">{k.trend}</span>
              <span>vs last period</span>
            </div>
            <div className="kpi-spark">
              <Sparkline data={k.spark} color="var(--muted-2)" />
            </div>
          </div>
        ))}
      </div>

      <div className="split">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Reactivation funnel</div>
            <button className="btn btn-ghost btn-sm" type="button">
              View all
            </button>
          </div>
          <div className="card-body">
            {funnel.map((f) => (
              <div className="funnel-row" key={f.label}>
                <div className="funnel-label">{f.label}</div>
                <div className="funnel-bar">
                  <div
                    className="funnel-bar-fill"
                    style={{
                      width: `${Math.max(f.pct, 2)}%`,
                      background: 'var(--accent)',
                    }}
                  />
                </div>
                <div className="funnel-num">{f.n}</div>
                <div className="funnel-pct">{f.pct}%</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Workflow health</div>
            <span className="chip success">
              <span className="chip-dot" />
              All systems go
            </span>
          </div>
          <div className="card-body">
            <div className="col" style={{ gap: 12 }}>
              <HealthRow label="Twilio SMS" status="Connected" tone="success" />
              <HealthRow label="Email channel" status="Not configured (v2)" tone="muted" />
              <HealthRow label="CRM sync" status="CSV upload only" tone="muted" />
              <HealthRow label="Sequence engine" status="Awaiting Inngest wiring" tone="warning" />
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div className="card-title">Recent activity</div>
          <button className="btn btn-ghost btn-sm" type="button">
            <IconExternalNoop /> Open activity log
          </button>
        </div>
        <div className="empty">
          <IconArrowUp />
          <div className="empty-title">No activity yet</div>
          <div>Upload a CSV from the Patients tab to start a reactivation sequence.</div>
        </div>
      </div>
    </>
  );
}

function HealthRow({
  label,
  status,
  tone,
}: {
  label: string;
  status: string;
  tone: 'success' | 'warning' | 'muted';
}) {
  const cls = tone === 'success' ? 'success' : tone === 'warning' ? 'warning' : '';
  return (
    <div className="row" style={{ justifyContent: 'space-between', fontSize: 13 }}>
      <span style={{ color: 'var(--text-2)' }}>{label}</span>
      <span className={`chip ${cls}`}>
        <span className="chip-dot" />
        {status}
      </span>
    </div>
  );
}
