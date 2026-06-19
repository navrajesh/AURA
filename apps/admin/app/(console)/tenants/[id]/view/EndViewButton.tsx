'use client';

import { useTransition } from 'react';

import { endTenantView } from '../actions';

export function EndViewButton({ tenantId }: { tenantId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => endTenantView(tenantId))}
      disabled={isPending}
      style={{
        padding: '6px 14px',
        background: 'var(--accent)',
        color: 'var(--bg)',
        border: 'none',
        borderRadius: 6,
        fontWeight: 600,
        fontSize: 13,
        cursor: isPending ? 'not-allowed' : 'pointer',
        opacity: isPending ? 0.6 : 1,
      }}
    >
      {isPending ? 'Ending…' : 'End view'}
    </button>
  );
}
