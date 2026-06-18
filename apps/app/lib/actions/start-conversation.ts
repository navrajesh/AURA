'use server';

import { revalidatePath } from 'next/cache';

import { findOrCreateConversation } from '@/lib/services/conversations';
import { SendError, sendSms } from '@/lib/services/messages';
import { requireCurrentContext } from '@/lib/tenant';

export type StartConversationResult =
  | { ok: true; conversationId: string }
  | { ok: false; message: string };

export async function startConversationAction(
  patientId: string,
  body: string,
): Promise<StartConversationResult> {
  let ctx;
  try {
    ctx = await requireCurrentContext();
  } catch {
    return { ok: false, message: 'Not authenticated' };
  }

  const trimmed = body.trim();
  if (!trimmed) return { ok: false, message: 'Message cannot be empty' };
  if (trimmed.length > 1600) return { ok: false, message: 'Message exceeds 1600 chars' };

  try {
    const conversationId = await findOrCreateConversation(ctx.tenantId, patientId);
    await sendSms({
      tenantId: ctx.tenantId,
      clerkUserId: ctx.userId,
      conversationId,
      body: trimmed,
    });
    revalidatePath('/inbox');
    return { ok: true, conversationId };
  } catch (err) {
    if (err instanceof SendError) return { ok: false, message: err.message };
    console.error('[start-conversation-action]', err);
    return { ok: false, message: (err as Error).message };
  }
}
