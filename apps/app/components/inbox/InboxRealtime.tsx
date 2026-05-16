'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Subscribes to the inbox SSE stream and triggers router.refresh() on every
 * inbox event, which re-renders the server components (conversation list +
 * thread). Reconnects on error with exponential backoff capped at 30s.
 */
export function InboxRealtime() {
  const router = useRouter();

  useEffect(() => {
    let source: EventSource | null = null;
    let retryMs = 1_000;
    let cancelled = false;

    function connect() {
      if (cancelled) return;
      source = new EventSource('/api/inbox/stream');

      source.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'ping') return;
          router.refresh();
        } catch {
          // Ignore malformed events.
        }
      };

      source.onerror = () => {
        source?.close();
        source = null;
        if (!cancelled) {
          setTimeout(connect, retryMs);
          retryMs = Math.min(retryMs * 2, 30_000);
        }
      };

      source.onopen = () => {
        retryMs = 1_000;
      };
    }

    connect();
    return () => {
      cancelled = true;
      source?.close();
    };
  }, [router]);

  return null;
}
