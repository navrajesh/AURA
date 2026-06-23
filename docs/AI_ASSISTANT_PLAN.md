# AURA Assistant — scoped AI chat for the customer app

> Status: proposed / not yet implemented. Written 2026-06-22.

## Context

Goal is a customer-facing AI feature primarily to support the sales pitch ("AURA is AI-enabled"), without taking on the cost/liability risk of a fully open-ended chatbot or the engineering cost of DB-backed tool-calling (that's reserved for a separate admin-console feature already discussed). Scope here: a standalone chat, branded as the **"AURA Assistant"**, limited to **10 messages/day per tenant**, that helps med-spa staff draft/refine SMS reactivation copy and brainstorm campaign messaging. It does **not** query live tenant data in v1 — that keeps it lean, avoids exposing patient data to the model, and avoids hallucination risk around real metrics. The system prompt explicitly declines medical/clinical questions, which matters because AURA operates in a health-adjacent space.

## UI / UX

- New nav item **"AI Assistant"** in `Sidebar.tsx` primary nav (between Templates and Data sources) — visible placement matters for the sales-pitch goal.
- New page `apps/app/app/(portal)/ai-assistant/page.tsx`: full chat thread (message bubbles, reusing visual style from `components/inbox/MessageBubble.tsx`), composer textarea at the bottom, and a "X/10 messages left today" badge.
- Empty state shows 3-4 suggested prompt chips, scoped to drafting (not data lookups) — e.g. "Draft a win-back SMS for lapsed patients," "Suggest 3 subject lines for a promo," "Make this message sound more casual." Avoids implying the assistant can answer real-data questions it can't.
- Static disclaimer above the composer: "Don't include real patient names or personal details — this assistant doesn't access your patient data."
- Quota-exhausted state: composer disables with `disabledReason="Daily AI limit reached — resets at midnight UTC"`, same `disabled` + `disabledReason` prop pattern already used by `NewConversationButton` in the inbox.
- Not-configured state (no `ANTHROPIC_API_KEY` set yet): mirror the existing Twilio pattern exactly — a `chip warning` reading "AI Assistant not configured" plus the composer disabled, so the feature ships safely even before a key is provisioned (matches `apps/app/app/(portal)/inbox/page.tsx:64-74`).
- Chat history is **not persisted** server-side — ephemeral per page load. Simplest, avoids storing potentially sensitive staff-typed content, and the AI SDK's `useChat()` just resends the in-memory message list each turn.

## Workflow / data flow

1. `page.tsx` calls `requireCurrentContext()`, then a new `getUsageToday(tenantId)` service call (via `withTenant`) to get today's message count, computes `remaining = 10 - count`, passes it into the client `Chat` component.
2. Client `Chat` component uses AI SDK's `useChat({ api: '/api/ai-assistant/chat' })` for streaming.
3. `POST /api/ai-assistant/chat`:
   - `requireCurrentContext()` → 401 on failure (same pattern as `api/imports/csv/route.ts`).
   - Atomically check+increment quota inside `withTenant`: `INSERT INTO ai_assistant_usage (tenant_id, day, message_count) VALUES (..., current_date, 1) ON CONFLICT (tenant_id, day) DO UPDATE SET message_count = ai_assistant_usage.message_count + 1 RETURNING message_count`. If the returned count > 10, return 429 before calling Claude.
   - If within quota, call Claude (Haiku model) via `ai` + `@ai-sdk/anthropic`, with a fixed system prompt (see below) + the client-sent message history, and stream the response back.
   - No message content is ever written to the DB — only the per-day counter.
4. Quota resets naturally at UTC midnight since `day` is part of the row key — no cron job needed.

## System prompt (fixed, not user-editable)

> You are the AURA Assistant, built into a med spa patient-reactivation platform. You help staff draft and refine SMS messages to win back lapsed patients, and brainstorm campaign messaging ideas. Keep drafted message copy concise and SMS-appropriate (~320 characters). Do not give medical advice, clinical recommendations, or diagnose conditions — redirect to drafting outreach copy instead. You do not have access to this tenant's live patient data, message history, or analytics in this version.

That last line is there so the model doesn't imply it has data access it doesn't have.

## New DB schema

In `packages/db/src/schema.ts`, add (following the exact `csvImports` pattern at lines 212-233):

```ts
export const aiAssistantUsage = pgTable(
  'ai_assistant_usage',
  {
    id: id(),
    tenantId: tenantId(),
    day: date('day').notNull(),
    messageCount: integer('message_count').notNull().default(0),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('uq_ai_assistant_usage_tenant_day').on(t.tenantId, t.day),
  ],
);
```

In `packages/db/sql/02-rls.sql`, add the same `tenant_isolation` (app_user) + `admin_all` (app_admin) policy pair used for `csv_imports` (lines 81-94), scoped to `ai_assistant_usage`.

Generate the migration with the repo's existing drizzle-kit script (mirrors how `csvImports` was added) and apply against Neon.

## New/changed files

- `packages/db/src/schema.ts` — add `aiAssistantUsage` table.
- `packages/db/sql/02-rls.sql` — add RLS policies for the new table.
- `apps/app/lib/env.ts` — add `getAnthropicConfig()`, same shape as `getTwilioConfig()` (returns `{ apiKey, configured }`), reading `ANTHROPIC_API_KEY` lazily.
- `apps/app/lib/services/ai-assistant.ts` (new) — `getUsageToday(tenantId)` and `checkAndIncrementUsage(tenantId)`, both via `withTenant`.
- `apps/app/app/api/ai-assistant/chat/route.ts` (new) — POST handler: auth → quota check/increment → stream Claude response. Follows the `requireCurrentContext` + typed-error pattern from `api/imports/csv/route.ts`.
- `apps/app/app/(portal)/ai-assistant/page.tsx` (new) — RSC: context + usage lookup, renders client chat component, shows not-configured chip if needed.
- `apps/app/components/ai-assistant/Chat.tsx` (new) — client component: `useChat()`, quota badge, suggested prompts, disabled states.
- `apps/app/components/portal/Sidebar.tsx` — add the new nav entry.
- `apps/app/package.json` — add `ai` and `@ai-sdk/anthropic`.
- `pnpm-workspace.yaml` — check for `ERR_PNPM_IGNORED_BUILDS` on install; add `allowBuilds:` entries if either new package runs a postinstall script (per the existing pnpm v11 quirk noted in CLAUDE.md).

## Safety / cost notes

- Haiku model + 10 msgs/day/tenant keeps API spend trivial even across many tenants.
- No tool-calling, no live DB access from the model — smallest possible liability and data-exposure surface for v1.
- Feature is gated behind `getAnthropicConfig().configured`, so it can ship to prod inert and be switched on later (or just before a sales demo) by setting one env var — no redeploy needed, same pattern as Twilio.

## Verification

1. `pnpm install` after adding the two new packages — confirm no `ERR_PNPM_IGNORED_BUILDS` warning (or resolve via `allowBuilds`).
2. Generate + apply the Drizzle migration against the dev DB; confirm `ai_assistant_usage` table + RLS policies exist (`\d+ ai_assistant_usage`, check policies in psql).
3. Without `ANTHROPIC_API_KEY` set: load `/ai-assistant`, confirm the "not configured" chip and disabled composer (mirrors current inbox behavior).
4. With the key set: send a message, confirm streaming response renders, quota badge decrements, and the system prompt's drafting focus holds (ask it a medical question — confirm it redirects rather than answering).
5. Send 10 messages in a day as one tenant; confirm the 11th is rejected with the quota-exhausted UI before any Claude API call is made (check no extra spend/log entry beyond the 10).
6. Confirm a second tenant's quota is independent (RLS isolation holds — query `ai_assistant_usage` as `app_user` for tenant A should not see tenant B's row).
