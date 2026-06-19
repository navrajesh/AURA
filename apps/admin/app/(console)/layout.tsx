import { UserButton } from '@clerk/nextjs';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { SidebarNav } from '@/components/SidebarNav';
import { Toast } from '@/components/Toast';
import { Topbar } from '@/components/Topbar';

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await currentUser();
  const adminEmail = user?.emailAddresses[0]?.emailAddress ?? null;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          AURA
          <small>admin console</small>
        </div>
        <SidebarNav />
        <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <UserButton />
        </div>
      </aside>
      <main className="main">
        <Topbar adminEmail={adminEmail} />
        <div className="page-content">{children}</div>
      </main>
      <Toast />
    </div>
  );
}
