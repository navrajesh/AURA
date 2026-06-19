'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { showToast } from '@/components/Toast';

import { setTenantStatus } from './actions';

export function SuspendTenantButton({
  tenantId,
  tenantName,
  status,
}: {
  tenantId: string;
  tenantName: string;
  status: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const suspended = status === 'suspended';

  function handleClick() {
    if (!suspended) {
      const ok = confirm(
        `Suspend "${tenantName}"?\n\nThis blocks all outbound SMS sending for this tenant. ` +
          `Their portal access and existing data are unaffected.`,
      );
      if (!ok) return;
    }
    startTransition(async () => {
      const result = await setTenantStatus(tenantId, suspended ? 'active' : 'suspended');
      if (result.ok) {
        showToast(
          suspended ? `"${tenantName}" reactivated` : `"${tenantName}" suspended`,
          suspended ? 'success' : 'danger',
        );
        router.refresh();
      } else {
        showToast(result.message, 'danger');
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      style={{
        padding: '6px 14px',
        background: 'transparent',
        color: suspended ? 'var(--success)' : 'var(--warning)',
        border: `1px solid ${suspended ? 'var(--success)' : 'var(--warning)'}`,
        borderRadius: 6,
        fontWeight: 600,
        fontSize: 13,
        cursor: isPending ? 'not-allowed' : 'pointer',
        opacity: isPending ? 0.6 : 1,
      }}
    >
      {isPending ? 'Saving…' : suspended ? 'Reactivate' : 'Suspend'}
    </button>
  );
}
