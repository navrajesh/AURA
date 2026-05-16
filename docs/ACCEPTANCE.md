# AURA v1 — Acceptance criteria

Maps each criterion from [AURA_Technical_Handover_v1_1.md §11](AURA_Technical_Handover_v1_1.md#11-acceptance-criteria-v1) to its current status against the dev environment (Neon `dev` branch, AURA Customer + Admin Clerk apps, partner Twilio credentials pending).

Legend: ✓ verified · ▷ code-complete, ready when Twilio creds land · — not yet exercised

## Database & multi-tenancy

- ✓ Migrations apply cleanly to an empty Neon database (`pnpm db:push` from scratch on the dev branch produced all 8 tables + indexes + check constraints)
- ✓ `app_user` and `app_admin` Postgres roles exist with the documented RLS policies (`pnpm db:setup-roles` creates them; `02-rls.sql` applies policies)
- ✓ With tenant context unset, `app_user` sees **zero** rows from any tenant-scoped table (verify-rls check 1)
- ✓ With tenant A's context set, `app_user` sees only tenant A's rows (verify-rls check 2)
- ✓ Tenant A and B counts sum to the admin count (verify-rls check 4)
- ✓ `app_admin` sees all rows across all tenants (verify-rls check 5)

Reproduce: `pnpm db:verify-rls` — expect 5/5 ✓.

## Auth

- ✓ Signing in to the customer app as a new user creates a Clerk Organization, a `tenants` row, and a `users` row via the Clerk webhook (verified end-to-end on first sign-in for `Glow Aesthetics (dev)`)
- ✓ Signing in to the admin app from a non-allowed email is rejected by Clerk (allowlist scoped to `navrajesh@gmail.com` on the AURA Admin instance)
- ✓ `middleware.ts` protects all portal routes; webhook routes (`/api/clerk/webhook`, `/api/twilio/webhook`, `/api/twilio/status`, `/api/inngest`) are accessible without a Clerk session — signature-verified instead

## CSV upload

- ✓ Uploading a 3-row valid CSV inserts 3 patients with `status='new'`, `source='csv'` (template CSV via "Download template" link)
- ✓ Re-uploading the same file produces 0 imported, 3 skipped (dedupe by `(tenant_id, phone)`)
- ✓ Uploading a file with one bad row (invalid phone) skips it with `errors[]` row index + reason
- ✓ A `csv_imports` row is recorded with correct counts and `status='complete'`
- ✓ Files > 5 MB are rejected with 413 (modal-side check + server-side check both)

## Twilio inbox

All criteria are **▷ code-complete**, awaiting Twilio credentials and `pnpm db:assign-twilio` to bind a number to the dev tenant. Reproduce per [README → Twilio (when partner credentials arrive)](../README.md#twilio-when-partner-credentials-arrive).

- ▷ Sending an SMS creates a `messages` row with `channel='sms'`, `direction='outbound'`, `status='queued'`, then updates to `status='sent'` with a `twilio_sid`
- ▷ Status callback updates `messages.status` to `delivered` when Twilio reports delivery
- ▷ Inbound SMS creates a `messages` row with `direction='inbound'`, upserts the conversation, and increments `unread_count`
- ▷ Duplicate inbound webhook (Twilio retry) results in only one `messages` row (`twilio_sid` unique constraint + `SELECT` before `INSERT`)
- ▷ Replying STOP sets `patients.opted_out=true` + `status='opted_out'`, then sends a Twilio confirmation
- ▷ Sending to an opted-out patient is rejected with `SendError('OPTED_OUT', ...)` before any Twilio API call (hard check in `sendSms()`)
- ▷ Inbox UI updates in real-time via SSE on inbound message
- ▷ `X-Twilio-Signature` validation enabled in dev and prod; invalid signatures → 403

## Other screens

- ✓ Sidebar + topbar + page shell match `design/aura-v1/project/index.html` reference visually (Geist fonts via `next/font`, design CSS variables verbatim)
- ✓ Dashboard, Sequences, Settings, Connections render as static screens with reference design
- ✓ Patients table reads from `patients` via `withTenant`, supports tab counts (All / New / Enrolled / Replied / Converted / Opted out)
- ✓ Admin app — `/tenants`, `/tenants/[id]`, `/audit` all wired with audit logging on every cross-tenant read

## v2 forward-compatibility (must remain additive)

- ✓ `messages` schema includes `body_html`, `subject`, `email_message_id`, `email_in_reply_to`, `email_references` — email channel adds without migration
- ✓ `messages.status` enum includes `bounced`, `complained`, `received` from day one
- ✓ `tenants.subdomain` column reserved (nullable, unused in v1) — first vanity-URL customer is a middleware change, not a migration
- ✓ `lib/twilio/intent.ts` returns `{ intent, confidence }` — LLM swap is a function-body change, no caller updates
- ✓ `MessageBubble` accepts a `channel` prop — email styling adds without parent changes
- ✓ Realtime bus is one file (`lib/realtime/bus.ts`); swap EventEmitter for Redis/Postgres LISTEN/NOTIFY without consumer changes

## Open items for follow-up sessions

These are flagged in §14 of the handover doc; not blocking v1 acceptance:

- Per-tenant Twilio subaccounts vs single account — defer until first paying customer
- A2P 10DLC registration workflow — us vs tenant
- Compliance / data retention policy (HIPAA adjacent)
- Onboarding flow for new tenants (manual Twilio number assignment for first 5 tenants)
- Pricing model — affects whether usage metering tables are needed in v2
