'use client';

import { useState, useTransition } from 'react';

import { sendMessageAction } from '@/lib/actions/send-message';

export function Composer({
  conversationId,
  disabled,
  disabledReason,
}: {
  conversationId: string;
  disabled: boolean;
  disabledReason?: string;
}) {
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!body.trim() || isPending || disabled) return;
    setError(null);
    startTransition(async () => {
      const result = await sendMessageAction(conversationId, body);
      if (result.ok) {
        setBody('');
      } else {
        setError(result.message);
      }
    });
  }

  const segments = Math.max(1, Math.ceil(body.length / 160));

  return (
    <div className="inbox-actions" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
      {disabled && disabledReason && (
        <div className="chip danger" style={{ alignSelf: 'flex-start' }}>
          <span className="chip-dot" />
          {disabledReason}
        </div>
      )}
      {error && (
        <div className="chip danger" style={{ alignSelf: 'flex-start' }}>
          <span className="chip-dot" />
          {error}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea
          className="textarea"
          placeholder={disabled ? 'Sending is disabled' : 'Reply…'}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={disabled || isPending}
          style={{ minHeight: 40, maxHeight: 160 }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <button
          type="button"
          className="btn btn-accent"
          disabled={!body.trim() || isPending || disabled}
          onClick={submit}
        >
          {isPending ? 'Sending…' : 'Send'}
        </button>
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', gap: 12 }}>
        <span>
          {body.length} chars • {segments} segment{segments === 1 ? '' : 's'}
        </span>
        <span>⌘+Enter to send</span>
      </div>
    </div>
  );
}
