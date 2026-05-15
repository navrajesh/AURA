export const dynamic = 'force-dynamic';

export default function ActivityPage() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity log</h1>
          <p className="page-sub">Live event stream across the workflow.</p>
        </div>
      </div>

      <div className="card">
        <div className="empty">
          <div className="empty-title">No events yet</div>
          <div>
            Inbound SMS, CSV imports, and sequence sends will land here once Phase 4 + 5 are
            wired.
          </div>
        </div>
      </div>
    </>
  );
}
