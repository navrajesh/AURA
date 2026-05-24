import 'server-only';

import { createDb, type Database } from '@aura/db';

import { env } from './env';

/**
 * Process-singleton Drizzle client bound to the customer-app role (app_user).
 * Lazy-initialised so env vars are not accessed at module load time (which
 * would break Next.js build-time page data collection).
 */
declare global {
  // eslint-disable-next-line no-var
  var __aura_db: Database | undefined;
}

export function getDb(): Database {
  if (!globalThis.__aura_db) {
    globalThis.__aura_db = createDb(env.DATABASE_URL);
  }
  return globalThis.__aura_db;
}

export { withTenant } from '@aura/db';
export * as schema from '@aura/db';
