function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function requireUrl(name: string): string {
  const v = required(name);
  if (v.includes('<') || v.includes('>')) {
    throw new Error(
      `Env var ${name} still contains placeholder angle brackets (\"<...>\"). ` +
        `Replace them with real values in apps/app/.env.local. Current value: ${v}`,
    );
  }
  try {
    // Throws on malformed URLs (empty, unknown protocol, etc.).
    new URL(v);
  } catch {
    throw new Error(
      `Env var ${name} is not a valid URL. Current value: ${JSON.stringify(v)}`,
    );
  }
  return v;
}

export const env = {
  get DATABASE_URL() { return requireUrl('DATABASE_URL'); },
  get CLERK_WEBHOOK_SECRET() { return required('CLERK_WEBHOOK_SECRET'); },
};

export function getOwnerDatabaseUrl(): string {
  return requireUrl('DATABASE_OWNER_URL');
}

export function getTwilioConfig() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const publicUrl = process.env.PUBLIC_URL;
  return {
    accountSid: sid,
    authToken: token,
    publicUrl,
    configured: Boolean(sid && token && publicUrl),
  };
}
