export function TenantBadge({ short, name, tier }: { short: string; name: string; tier: string }) {
  return (
    <div className="client-switcher" style={{ cursor: 'default' }}>
      <div className="client-avatar">{short}</div>
      <div className="client-info">
        <div className="client-name">{name}</div>
        <div className="client-tier">{tier}</div>
      </div>
    </div>
  );
}
