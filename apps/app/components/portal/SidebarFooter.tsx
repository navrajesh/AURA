'use client';

import { UserButton, useUser } from '@clerk/nextjs';

export function SidebarFooter() {
  const { user } = useUser();
  const name = user?.fullName || user?.username || 'You';
  const email = user?.primaryEmailAddress?.emailAddress ?? '';
  const initials = (user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '');

  return (
    <div className="sidebar-footer">
      <div className="user-avatar">{initials.toUpperCase() || 'U'}</div>
      <div className="user-info">
        <div className="user-name">{name}</div>
        <div className="user-email">{email}</div>
      </div>
      <UserButton />
    </div>
  );
}
