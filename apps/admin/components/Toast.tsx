'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { IconCheck, IconX } from './Icons';

type ToastDetail = { message: string; tone?: 'success' | 'danger' };

export function showToast(message: string, tone: ToastDetail['tone'] = 'success') {
  window.dispatchEvent(new CustomEvent<ToastDetail>('admin:toast', { detail: { message, tone } }));
}

export function Toast() {
  const [toast, setToast] = useState<ToastDetail | null>(null);
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    function handler(e: Event) {
      const detail = (e as CustomEvent<ToastDetail>).detail;
      setToast(detail);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setToast(null), 2500);
    }
    window.addEventListener('admin:toast', handler);
    return () => window.removeEventListener('admin:toast', handler);
  }, []);

  if (!mounted || !toast) return null;

  const danger = toast.tone === 'danger';

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        background: danger ? 'var(--danger)' : 'var(--text)',
        color: danger ? '#fff' : 'var(--bg)',
        fontSize: 13,
        fontWeight: 500,
        padding: '9px 16px',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow-md)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
      }}
    >
      {danger ? <IconX size={13} /> : <IconCheck size={13} />}
      {toast.message}
    </div>,
    document.body,
  );
}
