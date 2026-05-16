import { NextResponse } from 'next/server';

import { createDb, messages } from '@aura/db';
import { eq } from 'drizzle-orm';

import { getOwnerDatabaseUrl } from '@/lib/env';
import { applyStatusUpdate } from '@/lib/services/messages';
import { verifyTwilioSignature } from '@/lib/twilio/verify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
    routePath: '/api/twilio/status',
    params,
  });
  if (!ok) return new NextResponse('Invalid signature', { status: 403 });

  const sid = params.MessageSid;
  const status = params.MessageStatus;
  if (!sid || !status) return new NextResponse('Missing params', { status: 400 });

  const row = (
    await owner()
      .select({ tenantId: messages.tenantId })
      .from(messages)
      .where(eq(messages.twilioSid, sid))
      .limit(1)
  )[0];
  if (!row) {
    // Status for a message we don't know about — Twilio is delivering for an unrelated account?
    console.warn(`[twilio-status] no message for sid=${sid}`);
    return new NextResponse(null, { status: 200 });
  }

  await applyStatusUpdate({
    tenantId: row.tenantId,
    twilioSid: sid,
    status,
    errorCode: params.ErrorCode,
  });

  return new NextResponse(null, { status: 200 });
}

async function readParams(req: Request): Promise<Record<string, string>> {
  const text = await req.text();
  const params = new URLSearchParams(text);
  const out: Record<string, string> = {};
  for (const [k, v] of params.entries()) out[k] = v;
  return out;
}
