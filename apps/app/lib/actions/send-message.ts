'use server';

import { revalidatePath } from 'next/cache';

import { SendError, sendSms } from '@/lib/services/messages';
import { requireCurrentContext } from '@/lib/tenant';

export type SendResult =
  | { ok: true; messageId: string }
  | { ok: false; code: SendError['code'] | 'UNAUTHORIZED' | 'INTERNAL'; message: string };

export async function sendMessageAction(
  conversationId: string,
  body: string,
): Promise<SendResult> {
  let ctx;
  try {
    ctx = await requireCurrentContext();
  } catch {
    return { ok: false, code: 'UNAUTHORIZED', message: 'Not authenticated' };
  }

  const trimmed = body.trim();
  if (!trimmed) return { ok: false, code: 'INTERNAL', message: 'Empty message body' };
  if (trimmed.length > 1600)
    return { ok: false, code: 'INTERNAL', message: 'Message exceeds 1600 chars' };

  try {
    const msg = await sendSms({
      tenantId: ctx.tenantId,
      clerkUserId: ctx.userId,
      conversationId,
      body: trimmed,
    });
    revalidatePath('/inbox');
    return { ok: true, messageId: msg.id };
  } catch (err) {
    if (err instanceof SendError) {
      return { ok: false, code: err.code, message: err.message };
    }
    console.error('[send-message-action]', err);
    return { ok: false, code: 'INTERNAL', message: (err as Error).message };
  }
}
