import { ConversationList } from '@/components/inbox/ConversationList';
import { Composer } from '@/components/inbox/Composer';
import { InboxRealtime } from '@/components/inbox/InboxRealtime';
import { MessageBubble } from '@/components/inbox/MessageBubble';
import { StatusChip } from '@/components/portal/StatusChip';
import { getTwilioConfig } from '@/lib/env';
import {
  getThread,
  listConversations,
  markConversationRead,
  type ConversationListItem,
} from '@/lib/services/conversations';
import { requireCurrentContext, TenantNotReadyError } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

type Search = { c?: string };

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { c: activeId } = await searchParams;

  let items: ConversationListItem[] = [];
  let active: Awaited<ReturnType<typeof getThread>> = null;
  let tenantPending = false;

  try {
    const ctx = await requireCurrentContext();
    items = await listConversations(ctx.tenantId);
    if (activeId) {
      active = await getThread(ctx.tenantId, activeId);
      if (active && active.conversation.unreadCount > 0) {
        await markConversationRead(ctx.tenantId, activeId);
      }
    }
  } catch (err) {
    if (err instanceof TenantNotReadyError) tenantPending = true;
    else throw err;
  }

  const twilio = getTwilioConfig();

  return (
    <>
      <InboxRealtime />
      <div className="page-header">
        <div>
          <h1 className="page-title">Inbox</h1>
          <p className="page-sub">
            {tenantPending
              ? 'Tenant provisioning…'
              : `${items.length} conversation${items.length === 1 ? '' : 's'}`}
          </p>
        </div>
        {!twilio.configured && (
          <div className="chip warning">
            <span className="chip-dot" />
            Twilio not configured
          </div>
        )}
      </div>

      <div className="inbox-grid">
        <div className="inbox-list">
          <ConversationList items={items} />
        </div>
        <div className="inbox-detail">
          {active ? (
            <ThreadView thread={active} twilioConfigured={twilio.configured} />
          ) : (
            <div className="empty" style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
              <div>
                <div className="empty-title">Select a conversation</div>
                <div>Pick a thread from the list to start replying.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ThreadView({
  thread,
  twilioConfigured,
}: {
  thread: NonNullable<Awaited<ReturnType<typeof getThread>>>;
  twilioConfigured: boolean;
}) {
  const fullName =
    [thread.patient.firstName, thread.patient.lastName].filter(Boolean).join(' ') ||
    thread.patient.phone ||
    'Unknown';

  const disabledReason = !twilioConfigured
    ? 'Twilio not configured — set TWILIO_* env vars to enable sending'
    : thread.patient.optedOut
      ? 'Patient has opted out — replies are blocked'
      : !thread.patient.phone
        ? 'No phone number on file'
        : undefined;

  return (
    <>
      <div className="inbox-detail-header">
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{fullName}</div>
          <div style={{ color: 'var(--muted)', fontSize: 12 }} className="mono">
            {thread.patient.phone ?? '—'}
          </div>
        </div>
        <StatusChip status={thread.patient.status} />
      </div>
      <div className="inbox-thread">
        {thread.messages.length === 0 ? (
          <div className="empty">No messages yet.</div>
        ) : (
          thread.messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}
      </div>
      <Composer
        conversationId={thread.conversation.id}
        disabled={Boolean(disabledReason)}
        disabledReason={disabledReason}
      />
    </>
  );
}
