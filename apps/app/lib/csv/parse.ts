import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';
import Papa from 'papaparse';

/**
 * Canonical CSV field → patients column mapping.
 * Headers in the source CSV are normalized (lower-cased, non-alphanumerics
 * stripped) before lookup, so "First Name", "first_name", "FirstName" all
 * resolve to "firstname" and match the keys here.
 */
export const COLUMN_MAP: Record<string, CsvField> = {
  patientid: 'externalPatientId',
  externalpatientid: 'externalPatientId',
  firstname: 'firstName',
  lastname: 'lastName',
  phone: 'phone',
  phonenumber: 'phone',
  mobile: 'phone',
  email: 'email',
  emailaddress: 'email',
  lastvisitdate: 'lastVisitDate',
  lastvisit: 'lastVisitDate',
  lastservice: 'lastService',
  notes: 'notes',
  note: 'notes',
};

export type CsvField =
  | 'externalPatientId'
  | 'firstName'
  | 'lastName'
  | 'phone'
  | 'email'
  | 'lastVisitDate'
  | 'lastService'
  | 'notes';

export type ParsedRow = {
  rowIndex: number; // 1-based, as the user sees it
  externalPatientId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string; // E.164
  email?: string;
  lastVisitDate?: string; // YYYY-MM-DD
  lastService?: string;
  notes?: string;
};

export type RowError = {
  rowIndex: number;
  reason: string;
};

export type ParseResult = {
  rows: ParsedRow[];
  errors: RowError[];
  unmappedHeaders: string[];
};

/**
 * Lower-cases and strips non-alphanumerics from a header so lookups are
 * lenient on case, spaces, and underscores.
 */
function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Parses date strings the field-tested way: ISO YYYY-MM-DD first, then
 * common US M/D/YYYY (and dashed variants). Returns YYYY-MM-DD or null.
 */
function parseDate(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
  if (iso) {
    const [, y, m, d] = iso;
    return `${y}-${m!.padStart(2, '0')}-${d!.padStart(2, '0')}`;
  }

  const us = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/.exec(trimmed);
  if (us) {
    const [, m, d, y] = us;
    const year = y!.length === 2 ? (Number(y) > 50 ? `19${y}` : `20${y}`) : y!;
    return `${year}-${m!.padStart(2, '0')}-${d!.padStart(2, '0')}`;
  }

  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return null;
}

function normalizePhone(input: string, defaultCountry: CountryCode): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const parsed = parsePhoneNumberFromString(trimmed, defaultCountry);
  if (!parsed?.isValid()) return null;
  return parsed.number; // E.164
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ParseOptions = {
  defaultCountry?: CountryCode;
};

/**
 * Parses a UTF-8 CSV string into typed rows plus per-row errors.
 * Whole-file errors throw — the caller catches and marks csv_imports.failed.
 */
export function parseCsv(content: string, opts: ParseOptions = {}): ParseResult {
  const defaultCountry = opts.defaultCountry ?? 'US';

  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h,
  });

  if (result.errors.length > 0) {
    const first = result.errors[0]!;
    if (first.code === 'TooFewFields' || first.code === 'TooManyFields') {
      // Per-row column-count errors — surface as row errors, not whole-file.
    } else if (first.type === 'Quotes') {
      throw new Error(`CSV parse error at line ${(first.row ?? 0) + 1}: ${first.message}`);
    }
  }

  const headers = result.meta.fields ?? [];
  const headerMap = new Map<string, CsvField>();
  const unmappedHeaders: string[] = [];
  for (const h of headers) {
    const normalized = normalizeHeader(h);
    const field = COLUMN_MAP[normalized];
    if (field) headerMap.set(h, field);
    else unmappedHeaders.push(h);
  }

  const rows: ParsedRow[] = [];
  const errors: RowError[] = [];

  result.data.forEach((raw, idx) => {
    const rowIndex = idx + 2; // +1 for 1-based, +1 for header row
    const out: ParsedRow = { rowIndex };

    for (const [header, value] of Object.entries(raw)) {
      const field = headerMap.get(header);
      if (!field) continue;
      const trimmed = (value ?? '').trim();
      if (!trimmed) continue;

      if (field === 'phone') {
        const e164 = normalizePhone(trimmed, defaultCountry);
        if (!e164) {
          errors.push({ rowIndex, reason: `invalid phone "${trimmed}"` });
          continue;
        }
        out.phone = e164;
      } else if (field === 'email') {
        if (!EMAIL_RE.test(trimmed)) {
          errors.push({ rowIndex, reason: `invalid email "${trimmed}"` });
          continue;
        }
        out.email = trimmed.toLowerCase();
      } else if (field === 'lastVisitDate') {
        const iso = parseDate(trimmed);
        if (!iso) {
          errors.push({ rowIndex, reason: `unparseable date "${trimmed}"` });
          continue;
        }
        out.lastVisitDate = iso;
      } else {
        out[field] = trimmed;
      }
    }

    if (!out.phone && !out.email) {
      errors.push({ rowIndex, reason: 'row has neither phone nor email' });
      return;
    }

    rows.push(out);
  });

  return { rows, errors, unmappedHeaders };
}

/** Helper for the API route to surface required-column problems. */
export function requiredColumnsPresent(headers: string[]): { ok: boolean; missing: string[] } {
  const normalized = new Set(headers.map(normalizeHeader));
  const hasPhone = ['phone', 'phonenumber', 'mobile'].some((h) => normalized.has(h));
  const hasEmail = ['email', 'emailaddress'].some((h) => normalized.has(h));
  if (!hasPhone && !hasEmail) {
    return { ok: false, missing: ['phone', 'email (at least one required)'] };
  }
  return { ok: true, missing: [] };
}
