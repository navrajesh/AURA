/**
 * v1 keyword intent detection. v2 swap point: replace this function body with
 * an LLM call returning the same shape. Callers should not need changes.
 */

export type Intent = 'opt_out' | 'opt_in' | 'booking_interest' | 'other';
export type Confidence = 'high' | 'low';

export type IntentResult = { intent: Intent; confidence: Confidence };

const OPT_OUT_KEYWORDS = ['stop', 'stopall', 'unsubscribe', 'cancel', 'end', 'quit'];
const OPT_IN_KEYWORDS = ['start', 'unstop', 'yes'];
const BOOKING_KEYWORDS = [
  'book',
  'appointment',
  'schedule',
  'available',
  'when',
  'price',
  'cost',
  'how much',
  'interested',
];

export function detectIntent(body: string): IntentResult {
  const normalized = body.trim().toLowerCase();
  if (!normalized) return { intent: 'other', confidence: 'low' };

  // STOP keywords match only at the start of the message — "I stopped by"
  // shouldn't opt the patient out.
  for (const kw of OPT_OUT_KEYWORDS) {
    if (new RegExp(`^${kw}\\b`).test(normalized)) {
      return { intent: 'opt_out', confidence: 'high' };
    }
  }

  for (const kw of OPT_IN_KEYWORDS) {
    if (new RegExp(`^${kw}\\b`).test(normalized)) {
      return { intent: 'opt_in', confidence: 'high' };
    }
  }

  if (BOOKING_KEYWORDS.some((kw) => normalized.includes(kw))) {
    return { intent: 'booking_interest', confidence: 'low' };
  }

  return { intent: 'other', confidence: 'low' };
}
