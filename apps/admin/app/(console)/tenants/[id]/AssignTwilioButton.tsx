'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { assignTwilioNumber } from './actions';

export function AssignTwilioButton({
  tenantId,
  currentNumber,
}: {
  tenantId: string;
  currentNumber: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentNumber ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await assignTwilioNumber(tenantId, value);
      if (result.ok) {
        setEditing(false);
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  if (!editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="mono">{currentNumber ?? '—'}</span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          style={{
            padding: '2px 10px',
            background: 'transparent',
            border: '1px solid var(--border, #ccc)',
            borderRadius: 6,
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          {currentNumber ? 'Change' : 'Assign'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          className="mono"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="+15551234567"
          disabled={isPending}
          style={{
            padding: '4px 8px',
            border: '1px solid var(--border, #ccc)',
            borderRadius: 6,
            fontSize: 13,
            width: 160,
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape') {
              setEditing(false);
              setValue(currentNumber ?? '');
              setError(null);
            }
          }}
        />
        <button
          type="button"
          onClick={submit}
          disabled={isPending || !value.trim()}
          style={{
            padding: '4px 12px',
            background: 'var(--accent, #2563eb)',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: isPending ? 'not-allowed' : 'pointer',
            opacity: isPending ? 0.6 : 1,
          }}
        >
          {isPending ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setValue(currentNumber ?? '');
            setError(null);
          }}
          disabled={isPending}
          style={{
            padding: '4px 12px',
            background: 'transparent',
            border: '1px solid var(--border, #ccc)',
            borderRadius: 6,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
      {error && <div style={{ fontSize: 12, color: 'var(--danger, #dc2626)' }}>{error}</div>}
    </div>
  );
}
