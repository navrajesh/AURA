import 'server-only';

import { createDb, type Database } from '@aura/db';

import { env } from './env';

declare global {
  // eslint-disable-next-line no-var
  var __aura_admin_db: Database | undefined;
}

/** Drizzle client bound to the app_admin role (cross-tenant reads). Lazy-initialised
 *  so env vars are not accessed at module load time during Next.js build. */
export function getDb(): Database {
  if (!globalThis.__aura_admin_db) {
    globalThis.__aura_admin_db = createDb(env.DATABASE_URL);
  }
  return globalThis.__aura_admin_db;
}

/** Convenience re-export so existing callers don't need to change. */
export const db = new Proxy({} as Database, {
  get(_t, prop) {
    const real = getDb();
    const val = (real as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === 'function' ? (val as Function).bind(real) : val;
  },
});

export * from '@aura/db';
