import { and, eq, gt, inArray } from 'drizzle-orm';

import { createDb, messages, tenants } from '@aura/db';

import { getOwnerDatabaseUrl, getTwilioConfig } from '@/lib/env';
import { mapTwilioStatus } from '@/lib/services/messages';
import { getTwilioClient } from '@/lib/twilio/client';

import { inngest } from '../client';

/**
 * Nightly reconciliation: catches `messages` rows whose status never advanced
 * past 'queued'/'sent' because we missed a Twilio status callback. Queries
 * Twilio's Messages API for the last 48 hours, compares with our local rows,
 * and applies any drift updates.
 *
 * Single function, no transaction needed — each row update is idempotent.
 * Uses the owner DB client because reconciliation crosses tenant boundaries.
 */
let ownerDb: ReturnType<typeof createDb> | null = null;
function owner() {
  if (!ownerDb) ownerDb = createDb(getOwnerDatabaseUrl());
  return ownerDb;
}

export const reconcileTwilioStatus = inngest.createFunction(
  { id: 'reconcile-twilio-status', triggers: [{ cron: '0 3 * * *' }] },
  async ({ step, logger }) => {
    if (!getTwilioConfig().configured) {
      logger.info('Twilio not configured; skipping reconciliation');
      return { skipped: true, reason: 'twilio_not_configured' };
    }

    // Find local rows that haven't reached a terminal state.
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const pending = await step.run('load-pending', () =>
      owner()
        .select({
          id: messages.id,
          tenantId: messages.tenantId,
          twilioSid: messages.twilioSid,
          status: messages.status,
        })
        .from(messages)
        .where(and(inArray(messages.status, ['queued', 'sent']), gt(messages.createdAt, cutoff))),
    );

    if (pending.length === 0) {
      logger.info('No pending messages to reconcile');
      return { pending: 0, updated: 0 };
    }

    const twilio = getTwilioClient();
    let updated = 0;
    for (const row of pending) {
      if (!row.twilioSid) continue;
      try {
        const remote = await step.run(`fetch-${row.twilioSid}`, () =>
          twilio.messages(row.twilioSid!).fetch(),
        );
        const mapped = mapTwilioStatus(remote.status);
        if (mapped && mapped !== row.status) {
          await step.run(`update-${row.id}`, async () => {
            await owner()
              .update(messages)
              .set({
                status: mapped,
                statusUpdatedAt: new Date(),
                errorCode: remote.errorCode ? String(remote.errorCode) : null,
              })
              .where(eq(messages.id, row.id));
          });
          updated++;
        }
      } catch (err) {
        logger.warn('Failed to fetch Twilio status', {
          twilioSid: row.twilioSid,
          err: (err as Error).message,
        });
      }
    }

    void tenants; // schema import kept for future tenant-grouped reconciliation
    return { pending: pending.length, updated };
  },
);
