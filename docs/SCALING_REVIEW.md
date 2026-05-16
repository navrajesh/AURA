# Third-Party Services — Scaling Review for 50–100 Customers

**Date:** 2026-05-16  
**Scope:** 50–100 med spa tenants, each with ~500–2,000 lapsed patients, running 1–3 SMS campaigns/month.

---

## Neon DB

**Current tier:** Free (0.5 GB storage, 1 compute unit, auto-suspend)

| Scale concern | Detail |
|---|---|
| Storage | 50–100 tenants × ~2k patients = ~100–200k rows. Fine well into the free tier. |
| Connections | Neon's serverless driver pools efficiently, but auto-suspend adds cold-start latency (~500ms) on the free tier. |
| Compute | Free tier has 1 CU shared. At 50+ tenants hitting it concurrently, performance degrades. |

**Verdict:** Upgrade to **Launch ($19/mo)** by ~20 tenants — gets always-on compute, 10 GB storage, no cold starts. Scale tier ($69/mo) handles 100+ tenants comfortably. No architectural changes needed — Drizzle + `withTenant()` + RLS scales cleanly.

---

## Clerk (Authentication)

**Current:** Two separate Clerk apps (Customer + Admin), free tier.

| Scale concern | Detail |
|---|---|
| MAU limit | Free tier: 10,000 MAU. 100 tenants × a few staff each = ~300–500 MAU. No issue. |
| Orgs | Free: 100 orgs max. You'll hit this ceiling at exactly 100 tenants. |
| Webhooks | Svix delivery is reliable; no scaling concern. |

**Verdict:** Free tier works up to ~100 tenants, but **Pro ($25/mo)** is needed before hitting the 100-org ceiling. Plan the upgrade at ~80 tenants.

---

## Twilio (SMS)

**Current:** Pay-as-you-go, single account, partner-provisioned.

| Scale concern | Detail |
|---|---|
| Cost | ~$0.0079/SMS outbound (US). 100 tenants × 1k messages/month = ~$790/mo. |
| Throughput | Default long-code: 1 msg/sec per number. Bulk campaigns require A2P 10DLC registration. |
| Number management | Each tenant needs a dedicated number (or shared short code) — not a single shared number. |
| Status callbacks | Single webhook URL scales fine; Inngest handles the fan-out. |

**Verdict:** Most operationally complex service at scale. Before onboarding customers:
1. Register for **A2P 10DLC** (mandatory for US bulk SMS — $4/brand + $10/campaign, takes 1–2 weeks to approve).
2. Provision a dedicated Twilio number per tenant.
3. Confirm per-tenant sub-account or number routing strategy.

Budget ~$8–10/tenant/month for Twilio at modest volume.

---

## Inngest (Background Jobs)

**Current:** Free tier (50k function runs/month).

| Scale concern | Detail |
|---|---|
| Function runs | 100 tenants × 1k SMS sends = 100k+ runs/month — exceeds the free tier. |
| Concurrency | Free: 10 concurrent runs. Can cause delays during bulk campaign sends. |
| Retries/replay | Works fine across all tiers. |

**Verdict:** Move to **Basic ($20/mo)** before launch — 1M runs/month, higher concurrency. Well within budget at 50–100 tenants.

---

## Vercel (Hosting)

**Current:** Free / Hobby (assumed).

| Scale concern | Detail |
|---|---|
| Serverless functions | Free: 100 GB-hrs compute, 100k invocations/day. 50–100 tenants will exceed this quickly. |
| Bandwidth | Free: 100 GB/month. |
| Team features | Free tier does not support team access or branch preview environments. |
| Two apps | `apps/app` + `apps/admin` = two Vercel projects, each billed separately. |

**Verdict:** Upgrade to **Pro ($20/mo per member)** before going live with paying customers. Removes invocation limits and adds SLAs. At 50–100 tenants, hosting is ~$20–40/mo — manageable.

---

## Svix

Used only as a library for Clerk webhook signature verification — not a SaaS subscription. No scaling concern.

---

## Resend (v2 / future)

Not integrated yet. Free tier handles 3k emails/day — more than sufficient for 100 tenants at v2 launch.

---

## Summary

| Service | Current tier | Safe up to | Upgrade trigger | Est. cost at 100 tenants/mo |
|---|---|---|---|---|
| Neon DB | Free | ~20 tenants | Cold-start pain / concurrent load | ~$69 (Scale) |
| Clerk | Free | ~80 tenants | 100-org ceiling | ~$25 (Pro) |
| Twilio | Pay-as-go | Unlimited | A2P 10DLC before bulk sends | ~$800–1,000 (SMS volume) |
| Inngest | Free | ~5 tenants | 50k run/month limit | ~$20 (Basic) |
| Vercel | Free/Hobby | Dev only | Before first paying customer | ~$20–40 (Pro) |

**Total platform overhead (excluding Twilio SMS volume):** ~$135–160/mo at 100 tenants.

---

## Highest Priority Action

**Twilio A2P 10DLC registration** — mandatory for US bulk SMS, takes 1–2 weeks to approve, and is a hard blocker for production campaigns. Resolve this as soon as Twilio credentials are provisioned.
