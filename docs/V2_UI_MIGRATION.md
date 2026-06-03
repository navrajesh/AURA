# AURA v2 UI Migration

> **Source mockup:** https://navrajesh.github.io/aura-v1/desktop-app.html
> **Assessed:** 2026-06-01

---

## Part 1 — Feasibility & Effort Assessment

### What the mockup is

A React+Babel standalone prototype with 9 screens:

| Screen | v1 equivalent | Status |
|---|---|---|
| Overview | Dashboard | Major redesign |
| Patients | Patients | Minor polish |
| Inbox | Inbox | Minor polish |
| Sequence | Templates | Minor polish |
| Settings | Settings | Minor changes |
| Reports | Reports | Significant chart upgrade |
| Alerts | — | **New screen** |
| CRM | Connections | Significant redesign |
| Onboarding | — | **New 6-step wizard** |

---

### Design delta — what actually changes

#### 1. Design token rename (affects every file)

| v1 token | v2 token |
|---|---|
| `--text`, `--text-2` | `--ink`, `--ink-2` |
| `--panel`, `--panel-2` | `--surface`, `--surface-2` |
| `--border`, `--border-strong` | `--line`, `--line-strong` |
| `--bg` (warm white) | `--bg` (warm beige `#f3eee4`) |
| `--accent` (burnt orange `#C75D3C`) | `--accent` (champagne gold `#b8975a`) |

Every inline `var(--text-2)` etc. in `.tsx` files needs updating — roughly 100+ occurrences across ~15 components.

#### 2. Typography — biggest visual shift

v1 uses Geist only. v2 introduces **Cormorant Garamond** (`--ff-display`) for headings, section titles, and big numbers. Classes: `.display`, `.display-i`, `.eyebrow`. The new "AURA · Invites" italic serif wordmark comes from this. This is what makes the mockup feel like a luxury med-spa brand rather than a generic SaaS tool.

#### 3. Three themes instead of two — dark theme already designed

v1 has light + dark (cool navy). v2 ships three themes, all fully specified in the mockup CSS:

| Theme | `data-theme` | Background | Character |
|---|---|---|---|
| Ivory | `ivory` (default) | `#f3eee4` warm beige | Light, editorial |
| Obsidian | `obsidian` | `#15130f` deep brown-black | **Dark luxe** |
| Bone | `bone` | `#ebe1d2` soft parchment | Light, softer |

The mockup URL defaults to Ivory (light). Obsidian is the dark theme — it uses warm brown-black tones (not v1's cool navy `#0D1422`) to stay on-brand with the luxury spa palette. Key dark-mode token values:

```css
[data-theme="obsidian"] {
  --bg:        #15130f;
  --surface:   #1f1c17;
  --surface-2: #25211b;
  --ink:       #ede4d2;   /* warm cream */
  --accent:    #c9a96e;   /* gold — same family as light, brighter */
  --hot:       #d97a55;   /* warmer, less harsh than v1 danger red */
  --positive:  #8aa973;   /* desaturated green — more spa-like */
}
```

The three-theme system is a single `data-theme` attribute swap on `<body>`. `ThemeToggle` cycles `ivory → obsidian → bone` instead of v1's `light → dark`. No extra migration effort — all three themes are covered in one pass during the Phase 1 token rename.

#### 4. Sidebar structure

v1: simple nav links. v2 adds `SpaSwitcher` (client-switcher widget) + a "Modules · 1 of 4" section above the nav. The module concept is cosmetic for v1 — nothing to wire up — but the switcher would need to integrate with `TenantBadge`/Clerk org switching.

---

### Effort estimates

#### Full migration: ~10–12 dev-days

| Work unit | Effort | Notes |
|---|---|---|
| CSS foundation (tokens, fonts, classes) | 1.5d | Cormorant from `next/font/google`; global token rename; `.eyebrow`/`.display`/`.pill` additions |
| Sidebar + Topbar | 0.5d | SpaSwitcher cosmetic, alert badge |
| Overview/Dashboard | 2d | Hero $-revenue card, hot leads feed, SVG chart |
| Patients | 0.5d | Pill/chip restyling; table tweaks |
| Inbox | 0.5d | Typography polish; mostly same structure |
| Settings | 0.5d | Field-row restyling |
| Reports | 1d | SVG revenue chart (full rewrite vs current sparklines) |
| Alerts (new) | 1d | New feed screen, filter chips, notification prefs panel |
| CRM/Connections | 1d | Stats cards, enrollment rules list |
| Onboarding wizard | 2d | 6-step flow, most complex new piece |

#### Partial migrations (recommended entry points)

| Option | Effort | Impact | Recommended? |
|---|---|---|---|
| **CSS/token reset only** | 1.5d | 60–70% of the visual upgrade — warm editorial palette, gold accent, serif font | **Yes — do first** |
| **Overview redesign** | 2d (after CSS reset) | Most visible screen; hero revenue card is the flagship moment | Yes |
| **Alerts screen** | 1d | Purely additive, no regressions possible | Yes |
| **CRM redesign** | 1d | Makes connections feel real vs placeholder | After v1 is live |
| **Onboarding wizard** | 2d | High value but highest risk for regressions; new routing needed | After v1 is live |
| **Reports SVG chart** | 1d | Nice but sparklines work fine for now | Defer |

---

### Key risks

1. **Token rename blast radius** — `var(--text-2)`, `var(--panel)` etc. appear inline in ~15 component files, not just `globals.css`. Need a systematic find-and-replace pass before anything else, or you get partial theming.

2. **Cormorant Garamond loading** — It's a Google Font. `next/font/google` handles it fine, but needs to be added to `apps/app/app/layout.tsx` and the CSS variable bound — same pattern as Geist today. Prerequisite for all `.display` class work.

3. **SpaSwitcher** — The mockup shows a client-switcher in the sidebar for multi-spa selection. In v1 that maps to Clerk org switching. Cosmetically it can just be the `TenantBadge`; wiring the actual switcher would touch Clerk org logic.

4. **Mockup is static** — The mockup's Overview shows live KPI data, hot leads, revenue charts. v1 has placeholder zeros. The screen can be migrated visually today, but the numbers stay zeroed until the real query layer (post-Twilio) is in.

---

### Recommended phasing

| Phase | Scope | Effort | Trigger |
|---|---|---|---|
| 1 | CSS foundation — tokens, Cormorant Garamond, accent gold, three themes, `.eyebrow`/`.display`/`.pill` | 1.5d | Any time |
| 2 | Overview + Sidebar — hero revenue card, hot-leads feed, SpaSwitcher cosmetic, alert badge on nav | 2.5d | After Phase 1 |
| 3 | Alerts screen — new additive screen, no existing code touched | 1d | After Phase 1 |
| 4 | CRM + Onboarding — full CRM stats cards, 6-step onboarding wizard | 3d | After v1 is live with Twilio |

---

## Part 2 — DB Schema Changes

**Short answer: 2 new tables and 1 new column. Everything else is derivable or fits in existing JSONB.**

---

### Required changes

#### 1. `patients.lead_temperature` — new column

The Overview hot-leads feed and patient filtering both query `lead_temperature = 'hot'` / `'warm'`. Currently `patients` has `replied: boolean` but no temperature classification.

```ts
leadTemperature: text('lead_temperature'),
// constraint: null | 'hot' | 'warm' | 'cool'
```

Written by the Twilio webhook handler when an inbound reply is classified (keyword match: "yes", "book", "when", etc.). Without it the hot-leads feed on the Overview has no backing data.

#### 2. `alerts` table — new

The entire Alerts screen needs this. Nothing in the current schema captures in-app notifications.

```ts
export const alerts = pgTable('alerts', {
  id: id(),
  tenantId: tenantId(),
  patientId: uuid('patient_id').references(() => patients.id),  // nullable
  kind: text('kind').notNull(),     // 'hot-lead'|'click'|'system'|'opt-out'|'enrolled'|'converted'|'report'
  severity: text('severity').notNull().default('low'),  // 'high'|'warn'|'good'|'low'
  title: text('title').notNull(),
  body: text('body').notNull(),
  ctaLabel: text('cta_label'),
  ctaScreen: text('cta_screen'),
  unread: boolean('unread').notNull().default(true),
  createdAt: createdAt(),
});
```

Rows written by: Twilio webhook (hot-lead detected), sequence engine (enrolled/sent events), opt-out handler.

#### 3. `crm_syncs` table — new (Phase 4 / CRM screen only)

The CRM screen shows sync stats: records scanned, new lapsed found, skipped, last sync time. The existing `csv_imports` table only covers CSV uploads; CRM API syncs (Boulevard, Mangomint) have nowhere to log.

```ts
export const crmSyncs = pgTable('crm_syncs', {
  id: id(),
  tenantId: tenantId(),
  source: text('source').notNull(),  // 'boulevard'|'mangomint'|'csv'
  recordsScanned: integer('records_scanned').notNull().default(0),
  newLapsedFound: integer('new_lapsed_found').notNull().default(0),
  skipped: integer('skipped').notNull().default(0),
  status: text('status').notNull().default('running'),  // 'running'|'complete'|'failed'
  errorMessage: text('error_message'),
  startedAt: createdAt(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});
```

Only needed when building the CRM connection feature (Phase 4).

---

### No changes needed — already covered

| v2 Feature | How it's covered |
|---|---|
| Revenue KPIs | `patients.estimated_revenue_cents` + `patients.converted` |
| Messages sent / reply rate | Aggregate queries on `messages` + `patients.replied` |
| Funnel (enrolled → booked → converted) | `patients.status` enum already has all stages |
| Reactivation track breakdown | `patients.sequenceTrack` ('60_day'\|'90_day'\|'120_day') |
| Top reactivated services | `patients.lastService` WHERE `converted = true` |
| Inbox + messages | `conversations` + `messages` tables fully cover it |
| Settings fields (spa name, offer, booking link, send window, escalation routing) | `tenants.settings` JSONB |
| Notification preferences (SMS/email/Slack toggles) | `tenants.settings.notifications` JSONB path |
| Onboarding step tracking | `tenants.settings.onboarding_step` JSONB path, or add `'onboarding'` to `tenants_status_chk` |

---

### Migration effort

| Change | Effort | When |
|---|---|---|
| `patients.lead_temperature` column | 0.5d — migration + webhook write + RLS neutral | Before Overview hot-leads (Phase 2) |
| `alerts` table | 1d — schema + migration + RLS policy + write sites in webhook + sequence engine | Before Alerts screen (Phase 3) |
| `crm_syncs` table | 0.5d | Only if CRM screen (Phase 4) |
