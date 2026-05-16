import 'server-only';

import { Inngest } from 'inngest';

/**
 * Inngest client singleton. The signing key (INNGEST_SIGNING_KEY) is read
 * automatically by the SDK and is not needed at instantiation. The event
 * key (INNGEST_EVENT_KEY) is also read from env when send() is called.
 *
 * Local dev: run `npx inngest-cli@latest dev` to spin up the Dev Server.
 * It auto-discovers functions registered at /api/inngest.
 */
export const inngest = new Inngest({
  id: 'aura-app',
  name: 'AURA Customer App',
});
