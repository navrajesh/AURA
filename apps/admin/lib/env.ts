function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function requireUrl(name: string): string {
  const v = required(name);
  if (v.includes('<') || v.includes('>')) {
    throw new Error(
      `Env var ${name} still contains placeholder angle brackets. ` +
        `Replace them with real values in apps/admin/.env.local. Current value: ${v}`,
    );
  }
  try {
    new URL(v);
  } catch {
    throw new Error(`Env var ${name} is not a valid URL: ${JSON.stringify(v)}`);
  }
  return v;
}

export const env = {
  DATABASE_URL: requireUrl('DATABASE_URL'),
};
