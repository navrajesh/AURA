import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { Brand } from '@/components/portal/Brand';
import { SidebarFooter } from '@/components/portal/SidebarFooter';
import { SidebarNav } from '@/components/portal/Sidebar';
import { TenantBadge } from '@/components/portal/TenantBadge';
import { Topbar } from '@/components/portal/Topbar';
import { requireCurrentContext, TenantNotReadyError } from '@/lib/tenant';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { userId, orgId } = await auth();
  if (!userId) redirect('/sign-in');
  if (!orgId) redirect('/select-org');

  let tenantShort = '...';
  let tenantName = 'Loading';
  try {
    const ctx = await requireCurrentContext();
    tenantName = ctx.tenantName;
    tenantShort = shortFor(ctx.tenantName);
  } catch (err) {
    if (!(err instanceof TenantNotReadyError)) throw err;
    // Pages will render their own "tenant pending" state.
  }

  return (
    <div className="app fade-in">
      <aside className="sidebar">
        <Brand />
        <TenantBadge short={tenantShort} name={tenantName} tier="Med spa" />
        <SidebarNav />
        <SidebarFooter />
      </aside>
      <main className="main">
        <Topbar tenantShort={tenantShort} tenantName={tenantName} />
        <div className="page">{children}</div>
      </main>
    </div>
  );
}

function shortFor(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0]![0]! + words[1]![0]!).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
