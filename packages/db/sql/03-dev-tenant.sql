-- ============================================================================
-- 03-dev-tenant.sql — Seed two dev tenants for local testing and RLS verification.
--
-- Idempotent: re-running is a no-op (uses ON CONFLICT DO NOTHING on clerk_org_id).
-- The dev Clerk Org IDs are placeholders; they get overwritten by the real
-- Clerk org_id the first time you sign in (the webhook upserts on clerk_org_id).
-- ============================================================================

insert into tenants (id, clerk_org_id, name, timezone, status, settings)
values
  (
    '00000000-0000-0000-0000-00000000aaaa',
    'org_dev_tenant_a',
    'Glow Aesthetics (dev tenant A)',
    'America/Los_Angeles',
    'active',
    '{"spa_name":"Glow Aesthetics","booking_link":"https://example.com/book","reactivation_offer":"20% off"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-00000000bbbb',
    'org_dev_tenant_b',
    'Velvet Med Spa (dev tenant B)',
    'America/New_York',
    'active',
    '{"spa_name":"Velvet Med Spa","booking_link":"https://example.com/velvet","reactivation_offer":"$50 credit"}'::jsonb
  )
on conflict (clerk_org_id) do nothing;

-- A handful of patients per tenant so RLS isolation has something to filter.
insert into patients (tenant_id, first_name, last_name, phone, status, source)
values
  ('00000000-0000-0000-0000-00000000aaaa', 'Alice', 'Adams', '+15550000001', 'new', 'csv'),
  ('00000000-0000-0000-0000-00000000aaaa', 'Avery', 'Allen', '+15550000002', 'new', 'csv'),
  ('00000000-0000-0000-0000-00000000bbbb', 'Beth',  'Brown', '+15550000003', 'new', 'csv'),
  ('00000000-0000-0000-0000-00000000bbbb', 'Brian', 'Black', '+15550000004', 'new', 'csv')
on conflict (tenant_id, phone) where phone is not null do nothing;
