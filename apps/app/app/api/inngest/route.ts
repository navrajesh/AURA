import { serve } from 'inngest/next';

import { inngest } from '@/inngest/client';
import { reconcileTwilioStatus } from '@/inngest/functions/reconcile-twilio';

/**
 * Inngest webhook entry. Local dev: the Inngest CLI Dev Server (run
 * `npx inngest-cli@latest dev` in a separate terminal) auto-discovers this
 * endpoint at http://localhost:3000/api/inngest.
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [reconcileTwilioStatus],
});
