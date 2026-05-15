export const dynamic = 'force-dynamic';

export default function InboxPage() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inbox</h1>
          <p className="page-sub">Two-way SMS with patients. Wires up in Phase 5.</p>
        </div>
      </div>

      <div className="inbox-grid">
        <div className="inbox-list">
          <div className="empty">
            <div className="empty-title">No conversations yet</div>
            <div>Inbound SMS to your Twilio number will appear here.</div>
          </div>
        </div>
        <div className="inbox-detail">
          <div
            className="empty"
            style={{ flex: 1, display: 'grid', placeItems: 'center' }}
          >
            <div>
              <div className="empty-title">Select a conversation</div>
              <div>Pick a thread from the list to start replying.</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
