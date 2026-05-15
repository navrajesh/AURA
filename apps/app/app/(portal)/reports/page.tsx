export default function ReportsPage() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-sub">Weekly summaries and delivery health.</p>
        </div>
      </div>

      <div className="card">
        <div className="empty">
          <div className="empty-title">Reports not yet wired</div>
          <div>
            Reporting & digests are deferred to v1.x — they need real send volume to be useful.
          </div>
        </div>
      </div>
    </>
  );
}
