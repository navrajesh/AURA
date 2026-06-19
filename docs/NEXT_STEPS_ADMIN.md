# AURA Admin — what's next

Admin-console-specific roadmap (`apps/admin`). For customer-app and infra/deploy items, see [NEXT_STEPS.md](NEXT_STEPS.md).

Current admin app has: tenants list (read-only KPIs), tenant detail page (Twilio number assignment, delete tenant), audit log viewer. Everything below is unbuilt — ranked by how much pain it prevents as tenant count grows.

## 1. Tenant impersonation ("View as tenant")

Spec'd in the v1 handover doc and reserved in the audit log enum (`impersonate_start` / `impersonate_end` exist in `apps/admin/lib/audit.ts` but are never triggered anywhere) — planned but never built.

- Session-scoped override of tenant context for the admin user, viewing the customer app as that tenant
- Persistent banner while impersonating ("Viewing as {tenant} — End impersonation")
- Logs `impersonate_start` on entry, `impersonate_end` on exit (or session timeout)
- Highest-value item once there's more than 1-2 tenants — today, debugging a tenant issue means querying the DB directly

**Effort:** ~4-5 hrs (session-scoped context override + banner component + audit logging)

## 2. Suspend / Reactivate tenant

`tenants.status` already has a check constraint for `'suspended'` in the schema (`packages/db/src/schema.ts`) — the column exists, nothing reads or writes it except the implicit `'active'` default. Today the only admin action is the nuclear "Delete Tenant."

- Toggle action on tenant detail page (mirrors `AssignTwilioButton` / `DeleteTenantButton` pattern)
- Guard check in `sendSms()` (`apps/app/lib/services/messages.ts`) — block sends for suspended tenants with a clear `SendError`
- Status badge already renders `tenant.status` on both `/tenants` and `/tenants/[id]` — just needs the write path

**Effort:** ~2 hrs

## 3. Tenant search & filter on `/tenants`

The tenants list (`apps/admin/app/(console)/tenants/page.tsx`) is an unfiltered flat table — fine at 2 tenants, unusable past ~20.

- Client-side search box (name / Clerk org ID)
- Status filter (active / suspended)
- No new queries needed — filter the existing result set

**Effort:** ~1.5 hrs

## 4. Manual tenant creation (admin-side fallback)

Tenants are *only* ever created via the Clerk webhook (`/api/clerk/webhook`) on org signup — there's no admin-side fallback.

- Form: spa name, owner email → creates Clerk org via Clerk API, then the `tenants` row (mirrors what the webhook does)
- Needed if a customer is onboarded via a sales call instead of self-serve signup, or if the webhook ever fails and a tenant needs manual recovery
- The fiddly part: must call the Clerk Organizations API to create the org first (not just insert a DB row), then write `publicMetadata.aura_tenant_id` back onto it — same chicken-and-egg the webhook already solves, needs careful sequencing in the reverse direction

**Effort:** ~3 hrs

## 5. Per-tenant Twilio / A2P compliance dashboard

Surfaced directly by the Twilio go-live work — Messaging Services, sender pools, A2P 10DLC approval states, per-tenant number assignment. None of that status is visible in admin today beyond a raw phone number string on the tenant detail page.

- Per-tenant view: number assigned (✓/—), A2P 10DLC campaign status (approved / pending / not registered), Messaging Service association
- Likely needs a live Twilio API call per tenant (`client.messaging.v1.services(...).fetch()` or similar) — not just a DB read, since approval state lives on Twilio's side
- Prevents carrier rate-limiting/spam-flagging surprises as tenant count grows past 1

**Effort:** ~3-4 hrs

---

**Recommended build order:** #1 (impersonation) first — it's the only one already designed into the architecture and unblocks every future support conversation. #2 (suspend) next — cheapest, closes the starkest gap (delete-or-nothing). #3-5 as tenant count actually grows past a handful.

## References

- Customer-app + infra roadmap: [NEXT_STEPS.md](NEXT_STEPS.md)
- §11 acceptance: [ACCEPTANCE.md](ACCEPTANCE.md)
- Full v1 spec: [AURA_Technical_Handover_v1_1.md](AURA_Technical_Handover_v1_1.md)
