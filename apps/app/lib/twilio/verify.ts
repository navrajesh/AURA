import 'server-only';

import twilio from 'twilio';

import { getTwilioConfig } from '@/lib/env';

/**
 * Validates the X-Twilio-Signature header on a webhook POST.
 *
 *   - The URL passed to validateRequest must be the *publicly visible* URL
 *     Twilio used to sign the request, not the request the Next.js server
 *     received. Proxies (Vercel, Cloudflare, ngrok) rewrite Host headers and
 *     break signature validation if we reconstruct the URL from req.url.
 *   - We use PUBLIC_URL env var + the route path, joined explicitly.
 *
 * Twilio POSTs form-encoded bodies. Pass them in as a plain {key: value}
 * record after parsing FormData on the route handler.
 */
export function verifyTwilioSignature(args: {
  signature: string | null;
  routePath: string; // e.g. '/api/twilio/webhook'
  params: Record<string, string>;
}): boolean {
  const cfg = getTwilioConfig();
  if (!cfg.authToken || !cfg.publicUrl) return false;
  if (!args.signature) return false;

  const fullUrl = new URL(args.routePath, cfg.publicUrl).toString();
  return twilio.validateRequest(cfg.authToken, args.signature, fullUrl, args.params);
}
