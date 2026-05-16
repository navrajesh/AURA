import 'server-only';

import twilio from 'twilio';

import { getTwilioConfig } from '@/lib/env';

let cached: twilio.Twilio | null = null;

/**
 * Lazy-initialised Twilio REST client. Throws if Twilio env vars are missing,
 * so the customer app still runs (with the Inbox + send disabled) while we
 * wait for the partner to deliver credentials.
 */
export function getTwilioClient(): twilio.Twilio {
  if (cached) return cached;
  const cfg = getTwilioConfig();
  if (!cfg.configured || !cfg.accountSid || !cfg.authToken) {
    throw new Error(
      'Twilio not configured: set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and PUBLIC_URL in apps/app/.env.local',
    );
  }
  cached = twilio(cfg.accountSid, cfg.authToken);
  return cached;
}
