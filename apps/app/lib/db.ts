import 'server-only';

import { createDb, type Database } from '@aura/db';

import { env } from './env';

/**
 * Process-singleton Drizzle client bound to the customer-app role (app_user).
 * Reusing one client across requests avoids exhausting Neon's connection
 * pool on hot reload or warm serverless invocations.
 */
declare global {
  // eslint-disable-next-line no-var
  var __aura_db: Database | undefined;
}

export const db: Database = globalThis.__aura_db ?? createDb(env.DATABASE_URL);
if (process.env.NODE_ENV !== 'production') {
  globalThis.__aura_db = db;
}

export { withTenant } from '@aura/db';
export * as schema from '@aura/db';
