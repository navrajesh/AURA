import 'server-only';

import { createDb, type Database } from '@aura/db';

import { env } from './env';

declare global {
  // eslint-disable-next-line no-var
  var __aura_admin_db: Database | undefined;
}

/** Drizzle client bound to the app_admin role (cross-tenant reads). */
export const db: Database = globalThis.__aura_admin_db ?? createDb(env.DATABASE_URL);
if (process.env.NODE_ENV !== 'production') {
  globalThis.__aura_admin_db = db;
}

export * from '@aura/db';
