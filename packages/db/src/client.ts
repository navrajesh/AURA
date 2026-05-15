import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

export type Database = ReturnType<typeof createDb>;

/**
 * Create a Drizzle client bound to a specific Postgres connection string.
 * Apps create this once per process and reuse the instance.
 *
 * Neon pooled connections require `prepare: false` because pgbouncer in
 * transaction mode does not support prepared statements.
 */
export function createDb(connectionString: string) {
  const client = postgres(connectionString, {
    prepare: false,
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  return drizzle(client, { schema, casing: 'snake_case' });
}

export { schema };
export * from './schema';
