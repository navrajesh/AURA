export default function ConnectionsPage() {
  const twilioConfigured = Boolean(process.env.TWILIO_ACCOUNT_SID);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Data sources</h1>
          <p className="page-sub">Inbound channels and CRM connectors.</p>
        </div>
      </div>

      <div className="grid-3">
        <ConnCard
          title="Twilio SMS"
          desc="Outbound + inbound SMS via a tenant-assigned number."
          connected={twilioConfigured}
          status={twilioConfigured ? 'Connected' : 'Awaiting partner credentials'}
        />
        <ConnCard
          title="CSV upload"
          desc="Bulk-import the Master Patient List from your CRM."
          connected
          status="Available"
        />
        <ConnCard
          title="Resend (email)"
          desc="Email channel — additive in v2."
          connected={false}
          status="Deferred to v2"
        />
        <ConnCard title="Boulevard" desc="Booking + patient sync." connected={false} status="v2" />
        <ConnCard title="Mangomint" desc="Booking + patient sync." connected={false} status="v2" />
        <ConnCard title="Jane / Calendly" desc="Calendar integrations." connected={false} status="v2" />
      </div>
    </>
  );
}

function ConnCard({
  title,
  desc,
  connected,
  status,
}: {
  title: string;
  desc: string;
  connected: boolean;
  status: string;
}) {
  return (
    <div className={`conn-card ${connected ? 'connected' : ''}`}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="conn-logo">{title.charAt(0)}</div>
        <span className={`chip ${connected ? 'success' : ''}`}>
          <span className="chip-dot" />
          {status}
        </span>
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div>
        <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>{desc}</div>
      </div>
      <div>
        <button className="btn btn-sm" type="button" disabled={!connected}>
          {connected ? 'Manage' : 'Connect'}
        </button>
      </div>
    </div>
  );
}
