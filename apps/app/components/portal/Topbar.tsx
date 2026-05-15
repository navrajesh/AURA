'use client';

import { usePathname } from 'next/navigation';

import { IconBell, IconSearch, IconZap } from './Icons';

const labels: Record<string, string> = {
  '/dashboard': 'Overview',
  '/patients': 'Patients',
  '/inbox': 'Inbox',
  '/sequences': 'Templates',
  '/settings': 'Settings',
  '/connections': 'Data sources',
  '/activity': 'Activity log',
  '/reports': 'Reports',
};

export function Topbar({ tenantShort, tenantName }: { tenantShort: string; tenantName: string }) {
  const pathname = usePathname();
  const crumb = labels[pathname] ?? toTitle(pathname);
  void tenantName; // available for tooltips later

  return (
    <div className="topbar">
      <div className="breadcrumb">
        <span>AURA</span>
        <span className="sep">/</span>
        <span>{tenantShort}</span>
        <span className="sep">/</span>
        <span className="crumb-current">{crumb}</span>
      </div>

      <div className="topbar-actions">
        <div className="search">
          <IconSearch size={14} />
          <input placeholder="Search patients, replies, settings…" />
          <span className="kbd">⌘K</span>
        </div>
        <button className="icon-btn" type="button" aria-label="Quick actions">
          <IconZap size={14} />
        </button>
        <button className="icon-btn" type="button" aria-label="Notifications">
          <IconBell size={14} />
          <span className="dot" />
        </button>
        <div style={{ height: 24, width: 1, background: 'var(--border)' }} />
        <span className="chip success" style={{ padding: '3px 8px' }}>
          <span className="chip-dot" />
          Live
        </span>
      </div>
    </div>
  );
}

function toTitle(path: string) {
  const seg = path.split('/').filter(Boolean)[0] ?? '';
  return seg.charAt(0).toUpperCase() + seg.slice(1);
}
