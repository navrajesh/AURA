# AURA — Patient Reactivation OS

Multi-tenant SaaS portal for med spas to reactivate lapsed patients via SMS.

## Monorepo layout

```
apps/
  app/      Customer portal (Next.js 15, Clerk Customer instance, app_user DB role)
  admin/    Super admin portal (Next.js 15, Clerk Admin instance, app_admin DB role)

packages/
  db/       Shared Drizzle schema, withTenant helper, migrations, seeds

design/     Source HTML/CSS/JSX prototype from Claude Design (reference only)
docs/       Specs and handover documents
```

## Build status

- [x] Phase 0 — Monorepo scaffold
- [ ] Phase 1 — Shared DB package (Drizzle schema, RLS, withTenant)
- [ ] Phase 2 — Customer app scaffold (Next.js + Clerk + DB)
- [ ] Phase 3 — Portal UI shell from design source
- [ ] Phase 4 — CSV upload pipeline
- [ ] Phase 5 — Twilio inbox + SSE
- [ ] Phase 6 — Admin app
- [ ] Phase 7 — Inngest reconciliation (deferred)
- [ ] Phase 8 — Acceptance pass + dev README

## Quickstart

```bash
pnpm install
```

Per-app dev instructions appear in each app's README once scaffolded.

## Spec

See [docs/AURA_Technical_Handover_v1_1.md](docs/AURA_Technical_Handover_v1_1.md) for the full v1 MVP spec.
