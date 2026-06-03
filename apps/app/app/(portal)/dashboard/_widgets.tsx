export function RevenueHero({
  totalRevenueCents,
  convertedCount,
  totalPatients,
}: {
  totalRevenueCents: number;
  convertedCount: number;
  totalPatients: number;
}) {
  const total = totalRevenueCents / 100;
  const avg = convertedCount > 0 ? totalRevenueCents / convertedCount / 100 : 0;
  const rate = totalPatients > 0 ? Math.round((convertedCount / totalPatients) * 100) : 0;

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  return (
    <div style={heroCard}>
      <div style={heroLeft}>
        <div style={heroLabel}>Revenue Recovered · This Campaign</div>
        <div style={heroAmount}>
          <span style={heroDollar}>$</span>
          {total.toLocaleString('en-US', { maximumFractionDigits: 0 })}
        </div>
        {convertedCount === 0 ? (
          <div style={heroSub}>
            Revenue appears once your first patient converts.
          </div>
        ) : (
          <div style={heroSub}>
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>↑</span>
            {convertedCount} patient{convertedCount !== 1 ? 's' : ''} converted
            &nbsp;·&nbsp;
            {fmt(avg)} avg per patient
          </div>
        )}
      </div>

      <div style={heroDivider} />

      <div style={heroRight}>
        <StatBlock label="Patients converted" value={String(convertedCount)} />
        <StatBlock label="Avg patient value" value={convertedCount > 0 ? fmt(avg) : '—'} />
        <StatBlock label="Conversion rate" value={totalPatients > 0 ? `${rate}%` : '—'} />
      </div>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{
        fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
        textTransform: 'uppercase', color: 'var(--muted)',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 22, fontWeight: 700, color: 'var(--text)',
        letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </div>
    </div>
  );
}

const heroCard: React.CSSProperties = {
  background: 'linear-gradient(135deg, var(--panel) 60%, var(--accent-soft) 100%)',
  border: '1px solid var(--border)',
  borderTop: '3px solid var(--accent)',
  borderRadius: 'var(--radius-lg)',
  padding: '28px 32px',
  display: 'flex',
  alignItems: 'center',
  gap: 40,
  marginBottom: 20,
};

const heroLeft: React.CSSProperties = {
  flex: 2,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const heroLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
};

const heroAmount: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 3,
  fontSize: 64,
  fontWeight: 700,
  lineHeight: 1,
  color: 'var(--accent)',
  letterSpacing: '-0.03em',
  fontVariantNumeric: 'tabular-nums',
};

const heroDollar: React.CSSProperties = {
  fontSize: 36,
  fontWeight: 600,
  marginTop: 10,
  color: 'var(--accent)',
};

const heroSub: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--muted)',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

const heroDivider: React.CSSProperties = {
  width: 1,
  alignSelf: 'stretch',
  background: 'var(--border)',
};

const heroRight: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  paddingLeft: 8,
};

export function IconArrowUp() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: 'var(--muted-2)', marginBottom: 8 }}
    >
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

export function IconExternalNoop() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  );
}
