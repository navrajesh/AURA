# AURA — what's next

v1 build is structurally complete (9 commits on `main` through `2f27396`). The portal demos end-to-end except for SMS — code is ready; only credentials and webhook URLs block the eight ▷ items in [ACCEPTANCE.md](ACCEPTANCE.md).

## 1. Twilio go-live (~30 min, when partner creds land)

1. **Paste creds** into `apps/app/.env.local`:
   ```
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   PUBLIC_URL=https://<current-ngrok-url>
   ```
2. **Assign number** to dev tenant:
   ```powershell
   pnpm --filter=@aura/db assign-twilio org_<your_clerk_org_id> +15551234567
   ```
3. **Twilio console** → your number → set both webhooks to your ngrok URL:
   - Inbound SMS → `https://<ngrok>/api/twilio/webhook` (POST)
   - Status callback → `https://<ngrok>/api/twilio/status` (POST)
4. **Verify mobile** as Caller ID in Twilio console (trial accounts only).
5. **Restart** `pnpm dev:app`.
6. **Walk the ▷ items** in [ACCEPTANCE.md](ACCEPTANCE.md) — flip to ✓ as each passes. Commit.

Gotcha: ngrok free reissues a new URL on each `ngrok http` invocation. When it changes, update *both* Twilio webhooks + Clerk webhook + `PUBLIC_URL` in `.env.local`, then restart the dev server. Twilio signature validation breaks instantly if `PUBLIC_URL` drifts.

## 2. Deploy to Vercel (~1 hour, after Phase 5 is green locally)

1. **Vercel project per app** — `aura-app` and `aura-admin` as separate projects in the same Vercel workspace. Each one points at `apps/app` and `apps/admin` respectively. Set "Root directory" in project settings.
2. **Env vars** — copy from local `.env.local` files. For the customer app, add `PUBLIC_URL=https://app.yourdomain.com` (replaces ngrok). For admin, `PUBLIC_URL=https://admin.yourdomain.com`.
3. **Domains** — `app.<your-domain>` → customer project. `admin.<your-domain>` → admin project.
4. **Repoint webhooks** in production:
   - Clerk: `AURA Customer` → Webhooks → update endpoint URL to `https://app.<your-domain>/api/clerk/webhook`. Copy the new signing secret into Vercel env vars (`CLERK_WEBHOOK_SECRET`).
   - Twilio number config → update both webhook URLs to `https://app.<your-domain>/api/twilio/*`.
5. **Inngest** — connect the production app at https://www.inngest.com → it auto-registers the cron from `/api/inngest`.
6. **Smoke test** — full sign-up flow, CSV upload, send/receive SMS end-to-end against prod URLs.

The repo is intentionally Vercel-portable (no `@vercel/*` imports, `output: 'standalone'` in both `next.config.ts` files). Switching to Cloud Run / Fly.io / ECS later is `docker build apps/<name>` + repoint webhooks + ~1 day work.

## 3. Day-2 priorities (in rough order)

| Item | Why now | Effort |
|---|---|---|
| **A2P 10DLC registration** | Required before real customer SMS volume — without it, T-Mobile rate-limits to 4 msgs/sec and Twilio flags as spam risk | 1-3 days, partner-led, mostly paperwork (brand + campaign filings) |
| **First real tenant onboarding** | First paying customer needs their own Twilio number — manual for the first ~5, automation in v1.x | ~30 min per tenant manually |
| **Settings save** | Settings page currently displays from `tenants.settings` jsonb but doesn't save back. Need a Server Action and form submit. | ~1 hour |
| **Tenant white-label branding** | Spa owners want their logo and name in the portal header. See §4 for the three-option plan. Pre-req: Settings save. | 2–6 hours depending on option |
| **Sequence execution engine** | The 28-day reactivation flow is the actual product. Inngest scheduled function reads enrolled patients, computes `days_since_enrollment`, sends the right step. Reuses `sendSms()`. No schema change. | ~1 day |
| **Email channel (Resend)** | Schema already supports it (`body_html`, `subject`, etc.). New `sendEmail()`, new `/api/resend/webhook`, new channel value. | ~1 day |
| **CSV history + error re-download** | `csv_imports` table is populated but not surfaced anywhere in UI. Add a section under Patients showing recent uploads with downloadable error reports. | ~2 hours |
| **Booking integrations** | Boulevard / Mangomint / Calendly adapters — `lib/booking/` interface shipped pattern. Defer until customers ask. | 1-2 days per integration |
| **Vercel Analytics** | Add `@vercel/analytics` to `apps/app`: `pnpm --filter=@aura/app add @vercel/analytics`, then import `<Analytics />` from `@vercel/analytics/next` and place it inside `<body>` in `apps/app/app/layout.tsx`. Free on Hobby plan, privacy-friendly (no cookies), zero config. Enable in Vercel dashboard → project → Analytics tab after deploying. | ~10 min |
| **Reporting & digests** | Weekly summary nightly email to operators. Defer until there's real send volume worth reporting on. | ~half day |
| **HIPAA-adjacent data retention** | Med-spa data isn't strictly PHI but is sensitive. Document a retention policy + purge job before first real patient data is loaded. | ~half day |

## 4. Tenant white-label branding

Spa owners want their brand visible in the portal header. No schema migration needed — all branding keys live in the existing `tenants.settings jsonb` column. **Settings save (§3 table, ~1 hr) is a pre-req for all options.**

### Option A — Text banner only (~2 hrs)

A configurable strip below the topbar showing custom text and background colour.

- Add `banner_text`, `banner_bg`, `banner_text_color` keys to `tenants.settings` (no migration)
- Wire the Settings save Server Action (~1 hr, shared pre-req)
- Render a `<div>` just below `.topbar` in `apps/app/app/(portal)/layout.tsx`, server-rendered so no flash
- Add three new rows to the Settings page UI

### Option B — Spa logo replaces AURA mark in sidebar (~4 hrs) ← recommended

The `Brand` component (`apps/app/components/portal/Brand.tsx`) becomes tenant-aware. If `logo_url` is set it renders the spa's logo; otherwise falls back to the AURA mark.

- Everything in Option A
- Add `logo_url` to `tenants.settings`
- New upload endpoint `POST /api/settings/logo` → stores file to **Vercel Blob** (`@vercel/blob`, 1 GB free tier) and writes the returned URL back into `settings`
- `Brand` component reads `logo_url` from `requireCurrentContext()` and renders `<img>` or fallback
- Add a logo file-input row to the Settings page

### Option C — Per-tenant accent colour (~6 hrs)

Each spa gets their own accent colour replacing AURA's terracotta `#C75D3C`. All buttons, badges, and chips pick it up automatically via CSS variables.

- Everything in Option B
- Add `accent_color` (hex) to `tenants.settings`
- Portal layout injects `<style>:root{--accent:…;--accent-soft:…;--accent-strong:…}</style>` server-side — zero client JS
- Settings UI needs a colour picker `<input type="color">`
- Small util to derive `--accent-soft` (lighten + low opacity) and `--accent-strong` (darken) from the chosen hex

### Key facts

- `tenants.settings` jsonb already exists — no Drizzle migration for any option
- Logo upload is the only new infrastructure dependency (Vercel Blob)
- Colour injection is pure CSS; the three `--accent-*` variables already cover every coloured element

## 5. Known sharp edges to revisit

- **Watchpack errors on Windows** scanning `C:\System Volume Information` etc. — cosmetic noise; fix is `watchOptions.ignored` in `next.config.ts` if it annoys.
- **`pnpm-workspace.yaml` `allowBuilds:`** — every new dep with postinstall (e.g. native bindings) needs adding here. Watch for `ERR_PNPM_IGNORED_BUILDS` on `pnpm add`.
- **Single-instance SSE bus** in `lib/realtime/bus.ts` — works on Vercel's single function instance during light traffic; needs Redis pub/sub or Postgres LISTEN/NOTIFY at scale. Spec-§6.6 says swap one file.
- **CRLF warnings in git** — `.gitattributes` would silence them; not breaking anything so left as-is.

## 6. References

- Build spec: [AURA_Technical_Handover_v1_1.md](AURA_Technical_Handover_v1_1.md)
- §11 acceptance: [ACCEPTANCE.md](ACCEPTANCE.md)
- Dev runbook: [../README.md](../README.md)
