'use client';

import { useTransition } from 'react';

import { IconTrash } from '@/components/Icons';

import { deleteTenant } from './actions';

export function DeleteTenantButton({
  tenantId,
  tenantName,
}: {
  tenantId: string;
  tenantName: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (
      !confirm(
        `Permanently delete "${tenantName}" and all its data?\n\n` +
          `This removes all patients, messages, and imports.\n` +
          `Also delete the matching org in the Clerk dashboard.`,
      )
    )
      return;
    startTransition(() => deleteTenant(tenantId, tenantName));
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 14px',
        background: 'var(--danger, #dc2626)',
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        fontWeight: 600,
        fontSize: 13,
        cursor: isPending ? 'not-allowed' : 'pointer',
        opacity: isPending ? 0.6 : 1,
      }}
    >
      <IconTrash size={13} />
      {isPending ? 'Deleting…' : 'Delete Tenant'}
    </button>
  );
}
