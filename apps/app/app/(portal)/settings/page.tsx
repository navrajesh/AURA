import { requireCurrentContext, TenantNotReadyError } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  let tenantName = '—';
  try {
    const ctx = await requireCurrentContext();
    tenantName = ctx.tenantName;
  } catch (err) {
    if (!(err instanceof TenantNotReadyError)) throw err;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">Identity, send window, and escalation routing.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" type="button" disabled>
            Save changes
          </button>
        </div>
      </div>

      <div className="card card-padded">
        <Section title="Client identity">
          <Row label="Spa name" desc="Used in templates as {spa_name}.">
            <input className="input" defaultValue={tenantName} readOnly />
          </Row>
          <Row label="Provider name" desc="The lead provider patients recognise.">
            <input className="input" placeholder="Dr. Avery Johnson" />
          </Row>
          <Row label="Booking link" desc="Used in templates as {booking_link}.">
            <input className="input" placeholder="https://glow.example.com/book" />
          </Row>
        </Section>

        <Section title="Reactivation offer">
          <Row label="Offer" desc="Used in templates as {reactivation_offer}.">
            <input className="input" placeholder="20% off rebookings" />
          </Row>
          <Row label="Offer expiry" desc="Used in templates as {offer_expiry}.">
            <input className="input" placeholder="2026-06-30" />
          </Row>
        </Section>

        <Section title="Send window">
          <Row label="Hours" desc="Local-time bounds for outbound SMS.">
            <div className="row" style={{ gap: 8 }}>
              <input className="input" defaultValue="09:00" style={{ width: 120 }} />
              <span>–</span>
              <input className="input" defaultValue="18:00" style={{ width: 120 }} />
            </div>
          </Row>
        </Section>

        <Section title="Escalation">
          <Row label="Phone" desc="Number to alert on hot leads.">
            <input className="input" placeholder="+1 555 000 0000" />
          </Row>
          <Row label="Email" desc="Operator email for hot-lead digest.">
            <input className="input" placeholder="ops@spa.example.com" />
          </Row>
        </Section>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 12 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, margin: '8px 0 4px' }}>{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="field-row">
      <div className="field-meta">
        <div className="field-meta-label">{label}</div>
        <div className="field-meta-desc">{desc}</div>
      </div>
      <div>{children}</div>
    </div>
  );
}
