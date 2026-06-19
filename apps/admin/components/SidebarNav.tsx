'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/tenants', label: 'Tenants' },
  { href: '/audit', label: 'Audit log' },
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
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}
