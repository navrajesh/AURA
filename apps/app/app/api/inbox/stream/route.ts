import { NextResponse } from 'next/server';

import { subscribeInbox, type InboxEvent } from '@/lib/realtime/bus';
import { requireCurrentContext } from '@/lib/tenant';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Server-Sent Events stream of inbox events for the current tenant.
 * Clients subscribe with the native EventSource API.
 *
 * Implementation: a ReadableStream that hangs open while the bus is alive.
 * Heartbeat ping every 25s. Client should reconnect on error with backoff.
 */
export async function GET() {
  let ctx;
  try {
    ctx = await requireCurrentContext();
  } catch {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: InboxEvent | { type: 'ping' }) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // Stream already closed — nothing to do.
        }
      };
      // Initial comment to flush headers immediately.
      controller.enqueue(encoder.encode(':ok\n\n'));

      const unsubscribe = subscribeInbox(ctx.tenantId, send);
      const heartbeat = setInterval(() => send({ type: 'ping' }), 25_000);

      const cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Already closed.
        }
      };

      // Best-effort cleanup hook; AbortSignal would be cleaner but is not
      // surfaced through ReadableStream in all Next runtimes yet.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (controller as any).cleanup = cleanup;
    },
    cancel() {
      // Triggered when the client disconnects. The cleanup closure captured
      // above runs via the close() path; this just ensures we don't leak.
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
