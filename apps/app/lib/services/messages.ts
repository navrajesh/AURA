import 'server-only';

import { and, desc, eq, sql } from 'drizzle-orm';

import {
  conversations,
  messages,
  patients,
  tenants,
  users,
  withTenant,
  type Conversation,
  type Message,
  type NewConversation,
  type NewMessage,
  type Patient,
} from '@aura/db';

import { db } from '@/lib/db';
import { emitInbox } from '@/lib/realtime/bus';
import { detectIntent } from '@/lib/twilio/intent';
import { getTwilioClient } from '@/lib/twilio/client';

export class SendError extends Error {
  constructor(
    public readonly code: 'OPTED_OUT' | 'NO_PHONE' | 'TENANT_NOT_CONFIGURED' | 'PATIENT_NOT_FOUND',
    message: string,
  ) {
    super(message);
  }
}

/**
 * Send an outbound SMS in the context of a conversation. Performs the hard
 * opted_out check before any Twilio call. Inserts a queued messages row,
 * dispatches to Twilio, then updates the row with the returned SID.
 */
export async function sendSms(args: {
  tenantId: string;
  clerkUserId: string;
  conversationId: string;
  body: string;
}): Promise<Message> {
  return await withTenant(db, args.tenantId, async (tx) => {
    const tenantRow = (
      await tx.select().from(tenants).where(eq(tenants.id, args.tenantId)).limit(1)
    )[0];
    if (!tenantRow?.twilioFromNumber) {
      throw new SendError('TENANT_NOT_CONFIGURED', 'Tenant has no Twilio number assigned');
    }

    const convo = (
      await tx
        .select()
        .from(conversations)
        .where(eq(conversations.id, args.conversationId))
        .limit(1)
    )[0];
    if (!convo) throw new SendError('PATIENT_NOT_FOUND', 'Conversation not found');

    const patient = (
      await tx.select().from(patients).where(eq(patients.id, convo.patientId)).limit(1)
    )[0];
    if (!patient) throw new SendError('PATIENT_NOT_FOUND', 'Patient not found');
    if (patient.optedOut) {
      throw new SendError('OPTED_OUT', 'Patient has opted out — refusing to send');
    }
    if (!patient.phone) {
      throw new SendError('NO_PHONE', 'Patient has no phone number');
    }

    const sender = (
      await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.clerkUserId, args.clerkUserId))
        .limit(1)
    )[0];

    const insertRow: NewMessage = {
      tenantId: args.tenantId,
      conversationId: convo.id,
      patientId: patient.id,
      channel: 'sms',
      direction: 'outbound',
      bodyText: args.body,
      twilioFrom: tenantRow.twilioFromNumber,
      twilioTo: patient.phone,
      status: 'queued',
      sentByUserId: sender?.id ?? null,
    };
    const [queued] = await tx.insert(messages).values(insertRow).returning();
    if (!queued) throw new SendError('PATIENT_NOT_FOUND', 'Failed to record message');

    // Dispatch to Twilio outside the transaction would be ideal (slow API),
    // but doing it inside is correct for v1 — we want the row to stay
    // unless the send succeeds at status='sent'. If Twilio is slow we just
    // hold the tx open. Real fix is to enqueue via Inngest in v1.x.
    const twilio = getTwilioClient();
    let sid: string;
    let segments: number | undefined;
    let priceCents: number | undefined;
    try {
      const result = await twilio.messages.create({
        to: patient.phone,
        from: tenantRow.twilioFromNumber,
        body: args.body,
        statusCallback: new URL(
          '/api/twilio/status',
          process.env.PUBLIC_URL ?? 'http://localhost:3000',
        ).toString(),
      });
      sid = result.sid;
      segments = result.numSegments ? Number(result.numSegments) : undefined;
      const price = result.price ? Math.round(Math.abs(Number(result.price)) * 100) : undefined;
      priceCents = Number.isFinite(price) ? price : undefined;
    } catch (err) {
      await tx
        .update(messages)
        .set({ status: 'failed', errorCode: (err as Error).message.slice(0, 200) })
        .where(eq(messages.id, queued.id));
      throw err;
    }

    const [updated] = await tx
      .update(messages)
      .set({
        twilioSid: sid,
        status: 'sent',
        sentAt: sql`now()`,
        segments: segments ?? null,
        priceCents: priceCents ?? null,
      })
      .where(eq(messages.id, queued.id))
      .returning();
    if (!updated) throw new SendError('PATIENT_NOT_FOUND', 'Failed to update message');

    await tx
      .update(conversations)
      .set({
        lastActivityAt: sql`now()`,
        lastMessagePreview: args.body.slice(0, 120),
        lastMessageDirection: 'outbound',
      })
      .where(eq(conversations.id, convo.id));

    emitInbox({
      type: 'message.sent',
      tenantId: args.tenantId,
      conversationId: convo.id,
      messageId: updated.id,
    });

    return updated;
  });
}

/**
 * Record an inbound SMS. Idempotent on twilio_sid. Auto-creates patient and
 * conversation if needed. Runs the intent detector and handles opt-out
 * confirmation TwiML at the route handler level.
 */
export async function recordInbound(args: {
  tenantId: string;
  twilioSid: string;
  fromNumber: string;
  toNumber: string;
  body: string;
}): Promise<{
  message: Message;
  patient: Patient;
  conversation: Conversation;
  isNew: boolean;
  intent: ReturnType<typeof detectIntent>;
}> {
  return await withTenant(db, args.tenantId, async (tx) => {
    // Idempotency: did we already record this SID?
    const existing = (
      await tx.select().from(messages).where(eq(messages.twilioSid, args.twilioSid)).limit(1)
    )[0];
    if (existing) {
      const convo = (
        await tx
          .select()
          .from(conversations)
          .where(eq(conversations.id, existing.conversationId))
          .limit(1)
      )[0];
      const patient = (
        await tx.select().from(patients).where(eq(patients.id, existing.patientId)).limit(1)
      )[0];
      if (!convo || !patient) throw new Error('Inbound idempotency lookup inconsistent');
      return {
        message: existing,
        patient,
        conversation: convo,
        isNew: false,
        intent: detectIntent(existing.bodyText),
      };
    }

    // Find or create patient.
    let patient = (
      await tx
        .select()
        .from(patients)
        .where(and(eq(patients.tenantId, args.tenantId), eq(patients.phone, args.fromNumber)))
        .limit(1)
    )[0];
    if (!patient) {
      const [created] = await tx
        .insert(patients)
        .values({
          tenantId: args.tenantId,
          phone: args.fromNumber,
          status: 'new',
          source: 'manual',
        })
        .returning();
      patient = created;
    }
    if (!patient) throw new Error('Failed to create inbound patient');

    // Upsert conversation.
    let convo = (
      await tx
        .select()
        .from(conversations)
        .where(
          and(eq(conversations.tenantId, args.tenantId), eq(conversations.patientId, patient.id)),
        )
        .limit(1)
    )[0];
    if (!convo) {
      const newConvo: NewConversation = {
        tenantId: args.tenantId,
        patientId: patient.id,
        lastMessagePreview: args.body.slice(0, 120),
        lastMessageDirection: 'inbound',
        unreadCount: 1,
      };
      const [created] = await tx.insert(conversations).values(newConvo).returning();
      convo = created;
    } else {
      const [updated] = await tx
        .update(conversations)
        .set({
          lastActivityAt: sql`now()`,
          lastMessagePreview: args.body.slice(0, 120),
          lastMessageDirection: 'inbound',
          unreadCount: sql`${conversations.unreadCount} + 1`,
        })
        .where(eq(conversations.id, convo.id))
        .returning();
      convo = updated;
    }
    if (!convo) throw new Error('Failed to upsert conversation');

    // Insert the message.
    const [recorded] = await tx
      .insert(messages)
      .values({
        tenantId: args.tenantId,
        conversationId: convo.id,
        patientId: patient.id,
        channel: 'sms',
        direction: 'inbound',
        bodyText: args.body,
        twilioSid: args.twilioSid,
        twilioFrom: args.fromNumber,
        twilioTo: args.toNumber,
        status: 'received',
      })
      .returning();
    if (!recorded) throw new Error('Failed to record inbound message');

    const intent = detectIntent(args.body);

    // Apply intent side-effects on the patient record.
    if (intent.intent === 'opt_out') {
      await tx
        .update(patients)
        .set({ optedOut: true, optedOutAt: sql`now()`, status: 'opted_out' })
        .where(eq(patients.id, patient.id));
      patient = { ...patient, optedOut: true, status: 'opted_out' };
    } else if (intent.intent === 'opt_in') {
      await tx
        .update(patients)
        .set({ optedOut: false, optedOutAt: null, status: 'new' })
        .where(eq(patients.id, patient.id));
      patient = { ...patient, optedOut: false };
    } else {
      await tx
        .update(patients)
        .set({ replied: true, status: 'replied' })
        .where(eq(patients.id, patient.id));
      patient = { ...patient, replied: true, status: 'replied' };
    }

    emitInbox({
      type: 'message.received',
      tenantId: args.tenantId,
      conversationId: convo.id,
      messageId: recorded.id,
    });

    return { message: recorded, patient, conversation: convo, isNew: true, intent };
  });
}

/**
 * Map a Twilio MessageStatus to our local status enum.
 */
export function mapTwilioStatus(status: string): string | null {
  switch (status) {
    case 'queued':
      return 'queued';
    case 'sending':
    case 'sent':
      return 'sent';
    case 'delivered':
      return 'delivered';
    case 'undelivered':
      return 'undelivered';
    case 'failed':
      return 'failed';
    case 'received':
      return 'received';
    default:
      return null;
  }
}

/**
 * Apply a Twilio status callback to the local messages row. Tenant context
 * is supplied by the route handler after it resolves tenantId from the
 * twilio_sid (using the owner DB client).
 */
export async function applyStatusUpdate(args: {
  tenantId: string;
  twilioSid: string;
  status: string;
  errorCode?: string;
}): Promise<void> {
  const mapped = mapTwilioStatus(args.status);
  if (!mapped) return;
  await withTenant(db, args.tenantId, async (tx) => {
    const rows = await tx
      .update(messages)
      .set({
        status: mapped,
        statusUpdatedAt: sql`now()`,
        errorCode: args.errorCode ?? null,
      })
      .where(eq(messages.twilioSid, args.twilioSid))
      .returning({
        id: messages.id,
        conversationId: messages.conversationId,
      });
    const row = rows[0];
    if (row) {
      emitInbox({
        type: 'message.status_changed',
        tenantId: args.tenantId,
        conversationId: row.conversationId,
        messageId: row.id,
        status: mapped,
      });
    }
  });
}
