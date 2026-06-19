'use client';

import { useEffect, useState } from 'react';

/**
 * Renders in the viewer's browser-local timezone, always labeled (e.g.
 * "Jun 19, 2026, 3:42 PM EST") so it's never ambiguous which zone is shown.
 *
 * Deferred to a client-only effect: the server has no idea what timezone the
 * browser is in, so formatting must happen after mount — otherwise SSR would
 * render the server's timezone and silently never correct itself once
 * hydrated (suppressHydrationWarning hides the warning but not the bug).
 */
export function Timestamp({ value, dateOnly }: { value: Date | string; dateOnly?: boolean }) {
  const [formatted, setFormatted] = useState<string | null>(null);

  useEffect(() => {
    const d = typeof value === 'string' ? new Date(value) : value;
    const options: Intl.DateTimeFormatOptions = dateOnly
      ? { year: 'numeric', month: 'short', day: 'numeric' }
      : {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short',
        };
    setFormatted(new Intl.DateTimeFormat('en-US', options).format(d));
  }, [value, dateOnly]);

  return <span>{formatted ?? '—'}</span>;
}
