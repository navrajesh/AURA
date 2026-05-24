# AURA — Patient Reactivation OS

Multi-tenant SaaS portal for med spas to reactivate lapsed patients via SMS. Built per [docs/AURA_Technical_Handover_v1_1.md](docs/AURA_Technical_Handover_v1_1.md).

## Monorepo layout

```
apps/
  app/          Customer portal (Next.js 15, Clerk Customer instance, app_user DB role)
  admin/        Super admin portal (Next.js 15, Clerk Admin instance, app_admin DB role)

packages/
  db/           Shared Drizzle schema, withTenant helper, RLS policies, seeds

design/         Source HTML/CSS/JSX prototype from Claude Design (reference only)
docs/           Specs and acceptance criteria
```

## Build status

| Phase | What | Status |
|---|---|---|
| 0 | Monorepo scaffold | ✓ |
| 1 | DB package (Drizzle schema, RLS, withTenant, seeds) | ✓ |
| 2 | Customer app (Next.js + Clerk + DB) | ✓ |
| 3 | Portal UI shell from design source | ✓ |
| 4 | CSV upload pipeline | ✓ |
| 5 | Twilio inbox + SSE | ✓ code-complete; SMS end-to-end test awaits credentials |
| 6 | Admin app (Clerk + audit log) | ✓ |
| 7 | Inngest reconciliation | ✓ |
| 8 | Acceptance pass + README | ✓ |

See [docs/ACCEPTANCE.md](docs/ACCEPTANCE.md) for the spec-§11 checklist.

---

## Prerequisites

- **Node 22.13+ / 24 recommended** — use nvm: `nvm install 24 && nvm alias default 24`
- **pnpm 11+** — `corepack enable && corepack prepare pnpm@11 --activate` (preferred over npm install -g)
- **git**
- **ngrok** (only needed for Clerk webhook + Twilio webhook tests) — `winget install ngrok.ngrok`, then `ngrok config add-authtoken <token>`

External services (one-time setup, see the handover doc for click-by-click):

- **Neon Postgres** (`aura` database, owner connection string)
- **Clerk** — two applications: *AURA Customer* (Organizations enabled) and *AURA Admin* (allowlist restricted)
- **Twilio** — Account SID, Auth Token, and a phone number assigned to a tenant via `pnpm db:assign-twilio`
- **Inngest** (deferred; not required for local dev)

---

## First-time: new machine setup

Run these steps once on each machine that joins the project.

```bash
# 1. Install workspace deps
pnpm install

# 2. Configure the DB package with the Neon owner URL
cp packages/db/.env.example packages/db/.env
# edit packages/db/.env — set NEON_OWNER_URL to the Neon owner connection string

# 3. Configure apps/app/.env.local
cp apps/app/.env.example apps/app/.env.local
# edit apps/app/.env.local with:
#   DATABASE_URL          = APP_USER_URL  (from the DB setup below, or ask a teammate)
#   DATABASE_OWNER_URL    = NEON_OWNER_URL
#   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY  (AURA Customer app)
#   CLERK_WEBHOOK_SECRET  (from Clerk dashboard → Webhooks — filled in after ngrok step)
#   TWILIO_*              (when partner credentials arrive)

# 4. Configure apps/admin/.env.local
cp apps/admin/.env.example apps/admin/.env.local
# edit apps/admin/.env.local with:
#   DATABASE_URL          = APP_ADMIN_URL  (from the DB setup below, or ask a teammate)
#   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY  (AURA Admin app)
```

---

## First-time: database setup (run ONCE — first machine only)

The schema, roles, RLS policies, and seed data live in Neon and are shared across all
machines. Run this block once when the project is first created. Skip it on every
subsequent machine — it is a no-op at best and destructive (`db:seed`) at worst.

```bash
pnpm db:push                # push Drizzle schema to Neon
pnpm db:setup-roles         # creates app_user + app_admin roles; prints APP_USER_URL and APP_ADMIN_URL — save these
pnpm db:seed                # inserts dev tenant seed data
pnpm db:verify-rls          # expect 5/5 checks pass
```

Copy the printed `APP_USER_URL` and `APP_ADMIN_URL` into the `.env.local` files above.

---

## Launching the sites

Open two terminal tabs from the repo root. That's all that's needed for every dev session.

```bash
# Terminal 1 — customer portal: http://localhost:3000
pnpm dev:app

# Terminal 2 — admin portal: http://localhost:3001
pnpm dev:admin
```

> **Mac / nvm users:** if `node --version` shows anything below v22, run `nvm use 24` first.
> New terminals default to Node 24 automatically once `nvm alias default 24` is set.

For Clerk org creation or Twilio SMS testing, a third terminal running ngrok is also required
(see the [Clerk webhook](#clerk-webhook-one-time-per-dev-tunnel) section below).

---

## Other dev commands

```bash
# Schema changes — edit packages/db/src/schema.ts, then:
pnpm db:generate         # emit a new migration .sql
pnpm db:push             # apply to Neon

# Inspect data in a browser UI:
pnpm db:studio

# Typecheck all packages:
pnpm typecheck
```

---

## Clerk webhook (one-time per dev tunnel)

The customer app's `/api/clerk/webhook` provisions `tenants` + `users` on org creation. It needs a public URL.

```powershell
# Terminal A: customer app
pnpm dev:app

# Terminal B: ngrok tunnel
ngrok http 3000
# copy the https URL it prints
```

In the Clerk dashboard → **AURA Customer** → Webhooks → **Add endpoint**:

- **URL:** `https://<ngrok-url>/api/clerk/webhook`
- **Events:** `organization.created`, `organization.updated`, `organizationMembership.created`, `user.created`
- Copy the signing secret → paste into `apps/app/.env.local` as `CLERK_WEBHOOK_SECRET=whsec_...`
- Restart `pnpm dev:app` so the new secret loads

Note: ngrok free reissues a new URL on each `ngrok http` invocation. Update the Clerk webhook URL each time.

---

## Twilio (when partner credentials arrive)

```powershell
# 1. Fill in Twilio env vars in apps/app/.env.local:
#      TWILIO_ACCOUNT_SID=AC...
#      TWILIO_AUTH_TOKEN=...
#      PUBLIC_URL=https://<ngrok-url>

# 2. Assign the number to your dev tenant
pnpm --filter=@aura/db assign-twilio org_<your_clerk_org_id> +15551234567

# 3. In Twilio console, on the number's config page, set:
#      "A message comes in" → https://<ngrok-url>/api/twilio/webhook (POST)
#      "Status callback URL" → https://<ngrok-url>/api/twilio/status (POST)

# 4. Restart pnpm dev:app
```

Trial Twilio accounts can only send SMS to **Verified Caller IDs** — add your own mobile in the Twilio console before testing send.

---

## Hosting portability

Both apps are written without `@vercel/*` runtime imports and use `output: 'standalone'` in `next.config.ts`. To deploy to any Docker host (AWS ECS / Cloud Run / Fly.io / Railway / etc.):

```bash
pnpm --filter=@aura/app build
docker build -t aura-app apps/app
```

Migration to a new host is ~1 day: build the image, push, repoint webhook URLs (Clerk + Twilio) and Clerk allowed origin, set env vars. Neon, Clerk, Inngest, and Twilio are SaaS and don't move.

---

## Troubleshooting

- **"Tenant for org … not provisioned yet"** on dashboard — the Clerk webhook didn't fire. Check ngrok terminal for incoming POST, and Clerk dashboard → Webhooks → Message attempts for delivery status.
- **`pnpm: command not found`** in a fresh terminal — pnpm is in `%APPDATA%\npm`. Either restart the terminal or run `$env:Path += ";$env:APPDATA\npm"` once.
- **`ERR_INVALID_URL` from postgres** on the patients page — `DATABASE_URL` is malformed in `apps/app/.env.local`. The `requireUrl()` helper in `lib/env.ts` will surface the actual bad value.
- **Watchpack errors scanning `C:\`** — harmless. Next.js's file watcher trips over Windows system files at the drive root; they don't break compilation.
