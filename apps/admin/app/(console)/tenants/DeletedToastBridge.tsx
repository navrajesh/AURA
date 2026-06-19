'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { showToast } from '@/components/Toast';

/** Reads ?deleted=<name> after a tenant delete redirect, fires a toast, then strips the param. */
export function DeletedToastBridge() {
  const router = useRouter();
  const params = useSearchParams();
  const deleted = params.get('deleted');

  useEffect(() => {
    if (!deleted) return;
    showToast(`"${deleted}" deleted`, 'danger');
    router.replace('/tenants');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleted]);

  return null;
}
