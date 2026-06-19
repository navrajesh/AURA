import { UserButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { SidebarNav } from '@/components/SidebarNav';

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
        <SidebarNav />
        <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <UserButton />
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
