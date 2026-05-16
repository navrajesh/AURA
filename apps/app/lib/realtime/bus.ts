import 'server-only';

import { EventEmitter } from 'node:events';

/**
 * In-process pub/sub keyed by tenantId. Works for single-instance deploys.
 * For multi-instance (multiple Node processes), swap for Redis pub/sub or
 * Postgres LISTEN/NOTIFY without changing the consumer API.
 */

export type InboxEvent =
  | { type: 'message.received'; tenantId: string; conversationId: string; messageId: string }
  | { type: 'message.sent'; tenantId: string; conversationId: string; messageId: string }
  | {
      type: 'message.status_changed';
      tenantId: string;
      conversationId: string;
      messageId: string;
      status: string;
    };

declare global {
  // eslint-disable-next-line no-var
  var __aura_bus: EventEmitter | undefined;
}

function getBus(): EventEmitter {
  if (!globalThis.__aura_bus) {
    const bus = new EventEmitter();
    bus.setMaxListeners(0); // SSE clients are short-lived but numerous
    globalThis.__aura_bus = bus;
  }
  return globalThis.__aura_bus;
}

export function emitInbox(event: InboxEvent) {
  getBus().emit(`tenant:${event.tenantId}`, event);
}

export function subscribeInbox(
  tenantId: string,
  handler: (event: InboxEvent) => void,
): () => void {
  const bus = getBus();
  const channel = `tenant:${tenantId}`;
  bus.on(channel, handler);
  return () => bus.off(channel, handler);
}
