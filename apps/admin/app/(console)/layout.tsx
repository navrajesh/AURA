import { UserButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          AURA
          <small>admin console</small>
        </div>
        <Link href="/tenants" className="nav-link">
          Tenants
        </Link>
        <Link href="/audit" className="nav-link">
          Audit log
        </Link>
        <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <UserButton />
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
