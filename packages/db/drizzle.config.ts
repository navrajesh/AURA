import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env' });

const url = process.env.NEON_OWNER_URL;
if (!url) {
  throw new Error('NEON_OWNER_URL is not set. Copy .env.example to .env and fill it in.');
}

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url },
  casing: 'snake_case',
  strict: true,
  verbose: true,
});
