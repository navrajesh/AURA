import { UserButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { userId, orgId } = await auth();
  if (!userId) redirect('/sign-in');
  if (!orgId) redirect('/select-org');

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: 220,
          padding: 24,
          borderRight: '1px solid #e5e5e0',
          background: '#fff',
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 28 }}>AURA</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Link href="/dashboard" style={navLink}>Dashboard</Link>
          <Link href="/patients" style={navLink}>Patients</Link>
          <Link href="/inbox" style={navLink}>Inbox</Link>
          <Link href="/sequences" style={navLink}>Sequences</Link>
          <Link href="/settings" style={navLink}>Settings</Link>
          <Link href="/connections" style={navLink}>Connections</Link>
        </nav>
      </aside>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '16px 24px',
            borderBottom: '1px solid #e5e5e0',
            background: '#fff',
          }}
        >
          <UserButton />
        </header>
        <main style={{ flex: 1, padding: 24 }}>{children}</main>
      </div>
    </div>
  );
}

const navLink: React.CSSProperties = {
  padding: '6px 8px',
  borderRadius: 6,
  color: '#444',
  textDecoration: 'none',
  fontSize: 13,
};
