import 'server-only';

import { and, asc, desc, eq, sql } from 'drizzle-orm';

import {
  conversations,
  messages,
  patients,
  withTenant,
  type Message,
  type Patient,
} from '@aura/db';

import { db } from '@/lib/db';

export type ConversationListItem = {
  id: string;
  patientId: string;
  patientFirstName: string | null;
  patientLastName: string | null;
  patientPhone: string | null;
  lastActivityAt: Date;
  lastMessagePreview: string | null;
  lastMessageDirection: 'inbound' | 'outbound' | null;
  unreadCount: number;
  patientStatus: string;
  patientOptedOut: boolean;
};

export async function listConversations(tenantId: string): Promise<ConversationListItem[]> {
  return await withTenant(db, tenantId, async (tx) => {
    const rows = await tx
      .select({
        id: conversations.id,
        patientId: patients.id,
        patientFirstName: patients.firstName,
        patientLastName: patients.lastName,
        patientPhone: patients.phone,
        lastActivityAt: conversations.lastActivityAt,
        lastMessagePreview: conversations.lastMessagePreview,
        lastMessageDirection: conversations.lastMessageDirection,
        unreadCount: conversations.unreadCount,
        patientStatus: patients.status,
        patientOptedOut: patients.optedOut,
      })
      .from(conversations)
      .innerJoin(patients, eq(conversations.patientId, patients.id))
      .orderBy(desc(conversations.lastActivityAt))
      .limit(200);

    return rows.map((r) => ({
      ...r,
      lastMessageDirection: r.lastMessageDirection as 'inbound' | 'outbound' | null,
    }));
  });
}

export type ThreadView = {
  conversation: {
    id: string;
    lastActivityAt: Date;
    unreadCount: number;
  };
  patient: Patient;
  messages: Message[];
};

export async function getThread(
  tenantId: string,
  conversationId: string,
): Promise<ThreadView | null> {
  return await withTenant(db, tenantId, async (tx) => {
    const convo = (
      await tx
        .select({
          id: conversations.id,
          lastActivityAt: conversations.lastActivityAt,
          unreadCount: conversations.unreadCount,
          patientId: conversations.patientId,
        })
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1)
    )[0];
    if (!convo) return null;

    const patient = (
      await tx.select().from(patients).where(eq(patients.id, convo.patientId)).limit(1)
    )[0];
    if (!patient) return null;

    const msgs = await tx
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt))
      .limit(500);

    return {
      conversation: {
        id: convo.id,
        lastActivityAt: convo.lastActivityAt,
        unreadCount: convo.unreadCount,
      },
      patient,
      messages: msgs,
    };
  });
}

export async function markConversationRead(tenantId: string, conversationId: string) {
  await withTenant(db, tenantId, async (tx) => {
    await tx
      .update(conversations)
      .set({ unreadCount: 0 })
      .where(and(eq(conversations.id, conversationId)));
    await tx
      .update(messages)
      .set({ readAt: sql`now()` })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          eq(messages.direction, 'inbound'),
          sql`${messages.readAt} is null`,
        ),
      );
  });
}
