import { sql } from 'drizzle-orm';

import type { Database } from './client';

/**
 * Run a callback inside a transaction with `app.current_tenant` set to the
 * caller's tenant id. Every RLS-protected query inside the callback only
 * sees rows belonging to this tenant.
 *
 * `set_config(..., true)` is transaction-local — the setting is discarded
 * at commit and cannot leak across pooled connections.
 *
 * Throws if `tenantId` is empty or not a UUID string.
 */
export async function withTenant<T>(
  db: Database,
  tenantId: string,
  fn: (tx: Parameters<Parameters<Database['transaction']>[0]>[0]) => Promise<T>,
): Promise<T> {
  if (!tenantId || !UUID_RE.test(tenantId)) {
    throw new Error(`withTenant: invalid tenantId "${tenantId}"`);
  }
  return await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.current_tenant', ${tenantId}, true)`);
    return await fn(tx);
  });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
