import { desc } from 'drizzle-orm';

import { patients, withTenant } from '@aura/db';

import { AddPatientButton, PatientsTable } from '@/components/patients/PatientsTable';
import { UploadCsvButton } from '@/components/patients/UploadCsvButton';
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
              : `${rows.length} patient${rows.length === 1 ? '' : 's'} loaded.`}
          </p>
        </div>
        <div className="page-actions">
          <button className="btn" type="button" disabled>
            Export
          </button>
          <UploadCsvButton />
          <AddPatientButton />
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

      <PatientsTable rows={rows} />
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

function countByStatus(rows: (typeof patients.$inferSelect)[]) {
  const out: Record<string, number> = {};
  for (const r of rows) out[r.status] = (out[r.status] ?? 0) + 1;
  return out;
}
