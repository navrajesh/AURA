'use client';

import { usePathname } from 'next/navigation';

const labels: Record<string, string> = {
  dashboard: 'Dashboard',
  tenants: 'Tenants',
  audit: 'Audit log',
};

export function Topbar({ adminEmail }: { adminEmail: string | null }) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const topLabel = labels[segments[0] ?? ''] ?? 'Admin';
  const isDetail = segments.length > 1;

  return (
    <div className="topbar">
      <div className="breadcrumb">
        <span>AURA Admin</span>
        <span className="sep">/</span>
        <span className={isDetail ? '' : 'crumb-current'}>{topLabel}</span>
        {isDetail && (
          <>
            <span className="sep">/</span>
            <span className="crumb-current">Detail</span>
          </>
        )}
      </div>
      {adminEmail && <div className="topbar-admin mono">{adminEmail}</div>}
    </div>
  );
}
