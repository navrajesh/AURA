# AURA — Claude Code project context

Multi-tenant SaaS portal for med spas to reactivate lapsed patients via SMS. v1 MVP per [docs/AURA_Technical_Handover_v1_1.md](docs/AURA_Technical_Handover_v1_1.md).

## Status

v1 structurally complete on `main`. All 9 build phases shipped. SMS end-to-end test pending Twilio credentials (partner is provisioning). See [docs/ACCEPTANCE.md](docs/ACCEPTANCE.md) for the §11 ✓/▷ matrix and [docs/NEXT_STEPS.md](docs/NEXT_STEPS.md) for the resume runbook.

Before recommending current state, run `git log --oneline` and read the docs above — they're authoritative; this file is a stale-prone summary.

## User

Solo dev, Windows 10 + VS Code + PowerShell, Node 24 / pnpm 11 / git 2.53. Email `navrajesh@gmail.com` is the sole admin Clerk allowlist. Partner is provisioning Twilio (not done yet — don't assume creds are live).

Prefers phased plans with explicit checkpoints over single code dumps. Walk through service config (Neon / Clerk / ngrok / Twilio) before integration code. Surface errors with offender-name + actual-value over generic ones at env/config boundaries.

## Architecture quirks that affect every task

These choices live across the codebase and are easy to misread or accidentally revert. Recall before designing changes:

- **Tenant resolution via Clerk org publicMetadata.** The Clerk webhook (`/api/clerk/webhook`) writes `tenants.id` into `publicMetadata.aura_tenant_id`. App pages read it via `clerkClient.organizations.getOrganization()`, never via a DB SELECT-by-clerk_org_id. Sidesteps the RLS bootstrap chicken-and-egg. Use `requireCurrentContext()` from `apps/app/lib/tenant.ts`.
- **Owner DB client for webhook routes only.** `/api/clerk/webhook` and `/api/twilio/webhook` create their own client bound to `DATABASE_OWNER_URL` so they can write without a tenant context. App pages use `app_user`; admin app uses `app_admin`. Don't leak the owner client into authenticated request paths — it bypasses RLS.
- **Every tenant-scoped query goes through `withTenant(db, tenantId, async tx => ...)`.** Direct Drizzle queries from app code without it either fail (no rows visible) or are a code-review red flag.
- **Two separate Clerk apps**, not instances. `AURA Customer` and `AURA Admin` have independent `pk_test_`/`sk_test_`. Signing up to one ≠ access to the other. Allowlist on the admin app is strict.
- **pnpm v11 requires `allowBuilds:` in `pnpm-workspace.yaml`** for every native dep that runs postinstall (esbuild, sharp, @clerk/shared, protobufjs). If `pnpm add` warns `ERR_PNPM_IGNORED_BUILDS`, add the package and `pnpm install` again.
- **SSE bus is single-process** (`apps/app/lib/realtime/bus.ts`). Spec-approved for v1; one-file swap to Redis/Postgres LISTEN/NOTIFY at scale.

## Where to find more

| Need | Read |
|---|---|
| Full v1 spec, locked-in decisions, §11 criteria | `docs/AURA_Technical_Handover_v1_1.md` |
| What's verified vs blocked, what's next | `docs/ACCEPTANCE.md`, `docs/NEXT_STEPS.md` |
| Admin-console-specific roadmap (impersonation, suspend, etc.) | `docs/NEXT_STEPS_ADMIN.md` |
| Dev setup, Clerk webhook, Twilio handoff | `README.md` |
| Design tokens, screen markup reference | `design/aura-v1/project/` |

## Don't

- Don't pre-build for v2 (email channel, sequence engine, vanity subdomains, booking adapters). Schema is already forward-compatible; adding them is additive when the time comes.
- Don't propose CSV ingestion improvements past 10k rows / 5 MB in v1.
- Don't assume Twilio is live. If `getTwilioConfig().configured` is false the inbox shows the disabled state by design.
