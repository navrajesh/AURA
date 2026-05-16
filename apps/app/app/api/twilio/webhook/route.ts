import { NextResponse } from 'next/server';

import { createDb, messages, tenants } from '@aura/db';
import { eq } from 'drizzle-orm';

import { getOwnerDatabaseUrl } from '@/lib/env';
import { recordInbound } from '@/lib/services/messages';
import { getTwilioClient } from '@/lib/twilio/client';
import { verifyTwilioSignature } from '@/lib/twilio/verify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Owner-role DB client used only to look up tenant by twilio_from_number. */
let ownerDb: ReturnType<typeof createDb> | null = null;
function owner() {
  if (!ownerDb) ownerDb = createDb(getOwnerDatabaseUrl());
  return ownerDb;
}

export async function POST(req: Request) {
  const params = await readParams(req);
  const signature = req.headers.get('x-twilio-signature');
  const ok = verifyTwilioSignature({
    signature,
    routePath: '/api/twilio/webhook',
    params,
  });
  if (!ok) return new NextResponse('Invalid signature', { status: 403 });

  const from = params.From;
  const to = params.To;
  const body = params.Body ?? '';
  const sid = params.MessageSid;
  if (!from || !to || !sid) {
    return new NextResponse('Missing params', { status: 400 });
  }

  // Resolve tenant by the Twilio number that received this message.
  const tenantRow = (
    await owner().select({ id: tenants.id }).from(tenants).where(eq(tenants.twilioFromNumber, to)).limit(1)
  )[0];
  if (!tenantRow) {
    // Unknown number — log and ignore so the webhook still 200s and Twilio stops retrying.
    console.warn(`[twilio-webhook] no tenant for To=${to} (sid=${sid})`);
    return new NextResponse('<Response/>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  const result = await recordInbound({
    tenantId: tenantRow.id,
    twilioSid: sid,
    fromNumber: from,
    toNumber: to,
    body,
  });

  // STOP confirmation reply per spec §6.5.
  if (result.intent.intent === 'opt_out' && result.isNew) {
    try {
      const twilio = getTwilioClient();
      await twilio.messages.create({
        to: from,
        from: to,
        body: 'You have been unsubscribed. Reply START to resubscribe.',
      });
    } catch (err) {
      console.error('[twilio-webhook] failed to send STOP confirmation', err);
    }
  }

  return new NextResponse('<Response/>', {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  });
}

async function readParams(req: Request): Promise<Record<string, string>> {
  const text = await req.text();
  const params = new URLSearchParams(text);
  const out: Record<string, string> = {};
  for (const [k, v] of params.entries()) out[k] = v;
  return out;
}

// messages import is used indirectly by the service layer; tsc kept it during refactor.
void messages;
