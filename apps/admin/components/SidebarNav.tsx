'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { IconActivity, IconUsers } from './Icons';

const links = [
  { href: '/tenants', label: 'Tenants', Icon: IconUsers },
  { href: '/audit', label: 'Audit log', Icon: IconActivity },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-link ${active ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <link.Icon size={14} />
            {link.label}
          </Link>
        );
      })}
    </>
  );
}
