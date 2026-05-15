import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: join(process.cwd(), '.env') });

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`\n[setup] Missing env var: ${name}`);
    console.error(`[setup] Copy .env.example to .env and fill it in.\n`);
    process.exit(1);
  }
  return v;
}

export function readSql(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

export function connect(url: string) {
  return postgres(url, { prepare: false, max: 1, onnotice: () => {} });
}

export function generatePassword(): string {
  // 32 chars, URL-safe — Postgres accepts these.
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  for (const byte of buf) out += alphabet[byte % alphabet.length];
  return out;
}

/**
 * Replace the username and password of a Postgres URL while preserving host,
 * port, database, and query string.
 */
export function rewriteConnectionUrl(
  ownerUrl: string,
  newUser: string,
  newPassword: string,
): string {
  const u = new URL(ownerUrl);
  u.username = newUser;
  u.password = newPassword;
  return u.toString();
}
