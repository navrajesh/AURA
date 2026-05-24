import 'server-only';

import { and, eq, inArray, or, sql } from 'drizzle-orm';

import {
  csvImports,
  patients,
  users,
  withTenant,
  type NewCsvImport,
  type NewPatient,
} from '@aura/db';

import { parseCsv, requiredColumnsPresent, type RowError } from '@/lib/csv/parse';
import { getDb } from '@/lib/db';

export type ImportSummary = {
  importId: string;
  totalRows: number;
  imported: number;
  skipped: number;
  errors: RowError[];
  unmappedHeaders: string[];
};

export class ImportError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Imports a CSV file's contents for the given tenant.
 *
 *  - Throws ImportError(413) if the file exceeds 5 MB.
 *  - Throws ImportError(400) if required columns (phone or email) are missing.
 *  - Throws ImportError(422) on whole-file parse failures.
 *  - Per-row errors are accumulated in the returned summary; the import still
 *    "completes" with status='complete' as long as at least one row succeeded.
 */
export async function importCsvForTenant(args: {
  tenantId: string;
  clerkUserId: string;
  filename: string;
  csvText: string;
  csvBytes: number;
}): Promise<ImportSummary> {
  if (args.csvBytes > MAX_BYTES) {
    throw new ImportError(413, `File too large (${args.csvBytes} bytes; max ${MAX_BYTES})`);
  }

  return await withTenant(getDb(), args.tenantId, async (tx) => {
    // Resolve uploader user id (RLS lets us see our own row).
    const userRows = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkUserId, args.clerkUserId))
      .limit(1);
    const uploadedByUserId = userRows[0]?.id;
    if (!uploadedByUserId) {
      throw new ImportError(409, 'Uploader not provisioned in tenant');
    }

    // Parse first to validate column structure before opening an audit row.
    let parsed;
    try {
      parsed = parseCsv(args.csvText, { defaultCountry: 'US' });
    } catch (err) {
      throw new ImportError(422, (err as Error).message);
    }

    // Pull headers from the first non-empty line to check required columns.
    const firstLine = args.csvText.split(/\r?\n/, 1)[0] ?? '';
    const headers = firstLine.split(',').map((s) => s.trim().replace(/^"|"$/g, ''));
    const req = requiredColumnsPresent(headers);
    if (!req.ok) {
      throw new ImportError(400, `Required columns missing: ${req.missing.join(', ')}`);
    }

    const totalRows = parsed.rows.length + parsed.errors.length;

    // Open the audit row.
    const importRow: NewCsvImport = {
      tenantId: args.tenantId,
      uploadedByUserId,
      filename: args.filename,
      totalRows,
      importedCount: 0,
      skippedCount: 0,
      errors: [],
      status: 'processing',
    };
    const inserted = await tx
      .insert(csvImports)
      .values(importRow)
      .returning({ id: csvImports.id });
    const importId = inserted[0]!.id;

    // Find duplicates in one round-trip.
    const phones = parsed.rows.map((r) => r.phone).filter(Boolean) as string[];
    const externalIds = parsed.rows.map((r) => r.externalPatientId).filter(Boolean) as string[];

    const existing =
      phones.length === 0 && externalIds.length === 0
        ? []
        : await tx
            .select({
              phone: patients.phone,
              externalPatientId: patients.externalPatientId,
            })
            .from(patients)
            .where(
              and(
                eq(patients.tenantId, args.tenantId),
                or(
                  phones.length > 0 ? inArray(patients.phone, phones) : undefined,
                  externalIds.length > 0
                    ? inArray(patients.externalPatientId, externalIds)
                    : undefined,
                ),
              ),
            );

    const existingPhones = new Set(existing.map((e) => e.phone).filter(Boolean));
    const existingExternal = new Set(
      existing.map((e) => e.externalPatientId).filter(Boolean),
    );

    const toInsert: NewPatient[] = [];
    const skippedErrors: RowError[] = [];

    for (const row of parsed.rows) {
      const isDup =
        (row.phone && existingPhones.has(row.phone)) ||
        (row.externalPatientId && existingExternal.has(row.externalPatientId));
      if (isDup) {
        skippedErrors.push({ rowIndex: row.rowIndex, reason: 'duplicate' });
        continue;
      }
      toInsert.push({
        tenantId: args.tenantId,
        externalPatientId: row.externalPatientId ?? null,
        firstName: row.firstName ?? null,
        lastName: row.lastName ?? null,
        phone: row.phone ?? null,
        email: row.email ?? null,
        lastVisitDate: row.lastVisitDate ?? null,
        lastService: row.lastService ?? null,
        notes: row.notes ?? null,
        source: 'csv',
        status: 'new',
      });
      // Pre-populate the in-memory sets so duplicates *within* the same file
      // also get skipped after the first occurrence wins.
      if (row.phone) existingPhones.add(row.phone);
      if (row.externalPatientId) existingExternal.add(row.externalPatientId);
    }

    let importedCount = 0;
    if (toInsert.length > 0) {
      const inserted = await tx
        .insert(patients)
        .values(toInsert)
        .returning({ id: patients.id });
      importedCount = inserted.length;
    }

    const allErrors: RowError[] = [...parsed.errors, ...skippedErrors];
    const skippedCount = totalRows - importedCount;

    await tx
      .update(csvImports)
      .set({
        importedCount,
        skippedCount,
        errors: allErrors,
        status: 'complete',
        completedAt: sql`now()`,
      })
      .where(eq(csvImports.id, importId));

    return {
      importId,
      totalRows,
      imported: importedCount,
      skipped: skippedCount,
      errors: allErrors,
      unmappedHeaders: parsed.unmappedHeaders,
    };
  });
}
