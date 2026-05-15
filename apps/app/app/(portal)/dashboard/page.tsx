import { currentUser } from '@clerk/nextjs/server';

import { requireCurrentContext, TenantNotReadyError } from '@/lib/tenant';

export default async function DashboardPage() {
  const user = await currentUser();

  let tenantBlock: React.ReactNode;
  try {
    const ctx = await requireCurrentContext();
    tenantBlock = (
      <div style={card}>
        <div style={cardLabel}>Tenant</div>
        <div style={cardValue}>{ctx.tenantName}</div>
        <div style={cardMeta}>
          tenant_id: <code>{ctx.tenantId}</code>
        </div>
        <div style={cardMeta}>
          clerk_org_id: <code>{ctx.orgId}</code>
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof TenantNotReadyError) {
      tenantBlock = (
        <div style={{ ...card, borderColor: '#e8c7a5', background: '#fff8f0' }}>
          <div style={cardLabel}>Tenant setup pending</div>
          <p style={{ marginTop: 4, fontSize: 13 }}>
            The Clerk webhook hasn&apos;t provisioned this organization yet. Refresh in a few seconds.
          </p>
        </div>
      );
    } else {
      throw err;
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>
        Hello, {user?.firstName ?? user?.username ?? 'there'}
      </h1>
      <p style={{ color: '#666', marginBottom: 24 }}>
        Phase 2 placeholder. The full dashboard ships in Phase 3.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 720 }}>
        {tenantBlock}
        <div style={card}>
          <div style={cardLabel}>User</div>
          <div style={cardValue}>{user?.fullName ?? user?.emailAddresses?.[0]?.emailAddress}</div>
          <div style={cardMeta}>
            clerk_user_id: <code>{user?.id}</code>
          </div>
        </div>
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e5e5e0',
  borderRadius: 10,
  padding: 16,
};
const cardLabel: React.CSSProperties = {
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.6,
  color: '#888',
  marginBottom: 6,
};
const cardValue: React.CSSProperties = { fontSize: 16, fontWeight: 500, marginBottom: 8 };
const cardMeta: React.CSSProperties = {
  fontSize: 11,
  color: '#666',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  marginTop: 2,
};
