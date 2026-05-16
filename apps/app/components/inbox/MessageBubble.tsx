import type { Message } from '@aura/db';

export function MessageBubble({ message }: { message: Message }) {
  const out = message.direction === 'outbound';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 8 }}>
      <div className={`bubble ${out ? 'bubble-out' : 'bubble-in'}`}>{message.bodyText}</div>
      <div className={`bubble-meta ${out ? 'out' : ''}`}>
        {out ? `${labelForStatus(message.status)} • ` : ''}
        {formatTime(message.createdAt)}
        {message.channel === 'email' ? ' • email' : ''}
      </div>
    </div>
  );
}

function labelForStatus(s: string): string {
  switch (s) {
    case 'queued':
      return 'Queued';
    case 'sent':
      return 'Sent';
    case 'delivered':
      return 'Delivered';
    case 'undelivered':
      return 'Undelivered';
    case 'failed':
      return 'Failed';
    default:
      return s;
  }
}

function formatTime(d: Date): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
