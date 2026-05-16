'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import type { ConversationListItem } from '@/lib/services/conversations';

export function ConversationList({ items }: { items: ConversationListItem[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const activeId = params.get('c');

  if (items.length === 0) {
    return (
      <div className="empty">
        <div className="empty-title">No conversations yet</div>
        <div>Inbound SMS to your Twilio number will appear here.</div>
      </div>
    );
  }

  return (
    <>
      {items.map((c) => {
        const name = displayName(c);
        const active = c.id === activeId;
        return (
          <button
            key={c.id}
            type="button"
            className={`inbox-row ${active ? 'active' : ''} ${c.unreadCount > 0 ? 'unread' : ''}`}
            onClick={() => router.push(`/inbox?c=${c.id}`)}
            style={{
              textAlign: 'left',
              width: '100%',
              border: 'none',
              background: 'transparent',
              font: 'inherit',
              color: 'inherit',
              cursor: 'pointer',
            }}
          >
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}
            >
              <div style={{ fontWeight: c.unreadCount > 0 ? 600 : 500, fontSize: 13 }}>{name}</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
                {formatTime(c.lastActivityAt)}
              </div>
            </div>
            <div
              style={{
                color: 'var(--muted)',
                fontSize: 12,
                marginTop: 2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {c.lastMessageDirection === 'outbound' ? 'You: ' : ''}
              {c.lastMessagePreview ?? '—'}
            </div>
          </button>
        );
      })}
    </>
  );
}

function displayName(c: ConversationListItem): string {
  const parts = [c.patientFirstName, c.patientLastName].filter(Boolean);
  if (parts.length) return parts.join(' ');
  return c.patientPhone ?? 'Unknown';
}

function formatTime(d: Date): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
