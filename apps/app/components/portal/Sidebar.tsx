'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  IconActivity,
  IconDashboard,
  IconDatabase,
  IconInbox,
  IconMessage,
  IconReport,
  IconSettings,
  IconUsers,
} from './Icons';

type NavItem = {
  href: string;
  label: string;
  Icon: (p: { size?: number; className?: string }) => React.JSX.Element;
  badge?: number;
  count?: number;
  matchPrefix?: string;
};

const primary: NavItem[] = [
  { href: '/dashboard', label: 'Overview', Icon: IconDashboard },
  { href: '/patients', label: 'Patients', Icon: IconUsers, matchPrefix: '/patients' },
  { href: '/inbox', label: 'Inbox', Icon: IconInbox },
  { href: '/sequences', label: 'Templates', Icon: IconMessage },
  { href: '/connections', label: 'Data sources', Icon: IconDatabase },
];

const secondary: NavItem[] = [
  { href: '/activity', label: 'Activity log', Icon: IconActivity },
  { href: '/reports', label: 'Reports', Icon: IconReport },
  { href: '/settings', label: 'Settings', Icon: IconSettings },
];

export function SidebarNav() {
  const pathname = usePathname();
  const isActive = (item: NavItem) => {
    if (item.matchPrefix) return pathname.startsWith(item.matchPrefix);
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  return (
    <>
      <div className="nav-section">
        {primary.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${isActive(item) ? 'active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            <item.Icon className="icon" />
            {item.label}
            {item.badge ? <span className="badge">{item.badge}</span> : null}
            {item.count ? <span className="count">{item.count}</span> : null}
          </Link>
        ))}

        <div className="nav-label">System</div>
        {secondary.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${isActive(item) ? 'active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            <item.Icon className="icon" />
            {item.label}
          </Link>
        ))}
      </div>
    </>
  );
}
