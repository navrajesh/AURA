function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const env = {
  DATABASE_URL: required('DATABASE_URL'),
  CLERK_WEBHOOK_SECRET: required('CLERK_WEBHOOK_SECRET'),
};

export function getOwnerDatabaseUrl(): string {
  return required('DATABASE_OWNER_URL');
}
