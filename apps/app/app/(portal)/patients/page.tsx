import { desc } from 'drizzle-orm';

import { patients, withTenant } from '@aura/db';

import { UploadCsvButton } from '@/components/patients/UploadCsvButton';
import { StatusChip } from '@/components/portal/StatusChip';
import { TrackChip } from '@/components/portal/TrackChip';
import { getDb } from '@/lib/db';
import { requireCurrentContext, TenantNotReadyError } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export default async function PatientsPage() {
  let rows: (typeof patients.$inferSelect)[] = [];
  let pending = false;
  try {
    const ctx = await requireCurrentContext();
    rows = await withTenant(getDb(), ctx.tenantId, (tx) =>
      tx
        .select()
        .from(patients)
        .orderBy(desc(patients.lastVisitDate), desc(patients.createdAt))
        .limit(200),
    );
  } catch (err) {
    if (err instanceof TenantNotReadyError) pending = true;
    else throw err;
  }

  const counts = countByStatus(rows);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Patients</h1>
          <p className="page-sub">
            {pending
              ? 'Tenant provisioning…'
              : `${rows.length} patient${rows.length === 1 ? '' : 's'} loaded from CSV imports.`}
          </p>
        </div>
        <div className="page-actions">
          <button className="btn" type="button" disabled>
            Export
          </button>
          <UploadCsvButton />
        </div>
      </div>

      <div className="tabs">
        <Tab label="All" count={rows.length} active />
        <Tab label="New" count={counts.new ?? 0} />
        <Tab label="Enrolled" count={counts.enrolled ?? 0} />
        <Tab label="Replied" count={counts.replied ?? 0} />
        <Tab label="Converted" count={counts.converted ?? 0} />
        <Tab label="Opted out" count={counts.opted_out ?? 0} />
      </div>

      <div className="card">
        {rows.length === 0 ? (
          <div className="empty">
            <div className="empty-title">No patients yet</div>
            <div>Upload a CSV of lapsed patients to begin a reactivation sequence.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Last visit</th>
                  <th>Last service</th>
                  <th>Track</th>
                  <th>Status</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="cell-stack">
                        <span className="primary">{fullName(p)}</span>
                        {p.email && <span className="secondary">{p.email}</span>}
                      </div>
                    </td>
                    <td className="num">{p.phone ?? <span className="muted">—</span>}</td>
                    <td>{p.lastVisitDate ?? <span className="muted">—</span>}</td>
                    <td>{p.lastService ?? <span className="muted">—</span>}</td>
                    <td>
                      <TrackChip track={p.sequenceTrack} />
                    </td>
                    <td>
                      <StatusChip status={p.status} />
                    </td>
                    <td>
                      <span className="chip" style={{ textTransform: 'capitalize' }}>
                        {p.source}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function Tab({ label, count, active }: { label: string; count: number; active?: boolean }) {
  return (
    <div className={`tab ${active ? 'active' : ''}`}>
      {label}
      <span className="count">{count}</span>
    </div>
  );
}

function fullName(p: typeof patients.$inferSelect): string {
  const parts = [p.firstName, p.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Unnamed patient';
}

function countByStatus(rows: (typeof patients.$inferSelect)[]) {
  const out: Record<string, number> = {};
  for (const r of rows) out[r.status] = (out[r.status] ?? 0) + 1;
  return out;
}
