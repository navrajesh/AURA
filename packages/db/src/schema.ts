import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  index,
  inet,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

const tenantId = () =>
  uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' });

const id = () => uuid('id').primaryKey().default(sql`gen_random_uuid()`);

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

const updatedAt = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();

// --- tenants ----------------------------------------------------------------

export const tenants = pgTable(
  'tenants',
  {
    id: id(),
    clerkOrgId: text('clerk_org_id').notNull().unique(),
    name: text('name').notNull(),
    subdomain: text('subdomain').unique(),
    timezone: text('timezone').notNull().default('America/Los_Angeles'),
    twilioFromNumber: text('twilio_from_number'),
    twilioAccountSidRef: text('twilio_account_sid_ref'),
    settings: jsonb('settings').notNull().default(sql`'{}'::jsonb`),
    status: text('status').notNull().default('active'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check('tenants_status_chk', sql`${t.status} in ('active','suspended')`),
    index('idx_tenants_subdomain').on(t.subdomain).where(sql`${t.subdomain} is not null`),
  ],
);

// --- users ------------------------------------------------------------------

export const users = pgTable(
  'users',
  {
    id: id(),
    clerkUserId: text('clerk_user_id').notNull().unique(),
    tenantId: tenantId(),
    email: text('email').notNull(),
    fullName: text('full_name'),
    role: text('role').notNull().default('operator'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check('users_role_chk', sql`${t.role} in ('owner','operator')`),
    index('idx_users_tenant').on(t.tenantId),
  ],
);

// --- patients ---------------------------------------------------------------

export const patients = pgTable(
  'patients',
  {
    id: id(),
    tenantId: tenantId(),
    externalPatientId: text('external_patient_id'),
    firstName: text('first_name'),
    lastName: text('last_name'),
    phone: text('phone'),
    email: text('email'),
    lastVisitDate: date('last_visit_date'),
    lastService: text('last_service'),
    enrollmentDate: date('enrollment_date'),
    sequenceTrack: text('sequence_track'),
    status: text('status').notNull().default('new'),
    lastContactedAt: timestamp('last_contacted_at', { withTimezone: true }),
    lastMessageNumber: integer('last_message_number'),
    channelLastUsed: text('channel_last_used'),
    replied: boolean('replied').notNull().default(false),
    bookingLinkClicked: boolean('booking_link_clicked').notNull().default(false),
    optedOut: boolean('opted_out').notNull().default(false),
    optedOutAt: timestamp('opted_out_at', { withTimezone: true }),
    converted: boolean('converted').notNull().default(false),
    estimatedRevenueCents: integer('estimated_revenue_cents'),
    notes: text('notes'),
    source: text('source').notNull().default('csv'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check(
      'patients_sequence_track_chk',
      sql`${t.sequenceTrack} is null or ${t.sequenceTrack} in ('60_day','90_day','120_day')`,
    ),
    check(
      'patients_status_chk',
      sql`${t.status} in ('new','enrolled','replied','converted','opted_out','no_response','sequence_complete')`,
    ),
    check(
      'patients_channel_last_used_chk',
      sql`${t.channelLastUsed} is null or ${t.channelLastUsed} in ('sms','email')`,
    ),
    check('patients_source_chk', sql`${t.source} in ('csv','boulevard','mangomint','manual')`),
    index('idx_patients_tenant').on(t.tenantId),
    uniqueIndex('idx_patients_tenant_phone')
      .on(t.tenantId, t.phone)
      .where(sql`${t.phone} is not null`),
    uniqueIndex('idx_patients_tenant_external')
      .on(t.tenantId, t.externalPatientId)
      .where(sql`${t.externalPatientId} is not null`),
    index('idx_patients_tenant_status').on(t.tenantId, t.status),
  ],
);

// --- conversations ----------------------------------------------------------

export const conversations = pgTable(
  'conversations',
  {
    id: id(),
    tenantId: tenantId(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).notNull().defaultNow(),
    lastMessagePreview: text('last_message_preview'),
    lastMessageDirection: text('last_message_direction'),
    unreadCount: integer('unread_count').notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check(
      'conversations_last_direction_chk',
      sql`${t.lastMessageDirection} is null or ${t.lastMessageDirection} in ('inbound','outbound')`,
    ),
    uniqueIndex('idx_conversations_tenant_patient').on(t.tenantId, t.patientId),
    index('idx_conversations_tenant_activity').on(t.tenantId, t.lastActivityAt.desc()),
  ],
);

// --- messages ---------------------------------------------------------------

export const messages = pgTable(
  'messages',
  {
    id: id(),
    tenantId: tenantId(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),

    channel: text('channel').notNull(),
    direction: text('direction').notNull(),

    bodyText: text('body_text').notNull(),
    bodyHtml: text('body_html'),
    subject: text('subject'),

    twilioSid: text('twilio_sid').unique(),
    twilioFrom: text('twilio_from'),
    twilioTo: text('twilio_to'),
    segments: integer('segments'),
    priceCents: integer('price_cents'),

    emailMessageId: text('email_message_id'),
    emailInReplyTo: text('email_in_reply_to'),
    emailReferences: text('email_references'),

    status: text('status').notNull().default('queued'),
    statusUpdatedAt: timestamp('status_updated_at', { withTimezone: true }),
    errorCode: text('error_code'),

    sentByUserId: uuid('sent_by_user_id').references(() => users.id),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    readAt: timestamp('read_at', { withTimezone: true }),

    createdAt: createdAt(),
  },
  (t) => [
    check('messages_channel_chk', sql`${t.channel} in ('sms','email')`),
    check('messages_direction_chk', sql`${t.direction} in ('inbound','outbound')`),
    check(
      'messages_status_chk',
      sql`${t.status} in ('queued','sent','delivered','undelivered','failed','received','bounced','complained')`,
    ),
    index('idx_messages_tenant_conv').on(t.tenantId, t.conversationId, t.createdAt.desc()),
    index('idx_messages_tenant_patient').on(t.tenantId, t.patientId, t.createdAt.desc()),
    index('idx_messages_status_pending')
      .on(t.status)
      .where(sql`${t.status} in ('queued','sent')`),
  ],
);

// --- csv_imports ------------------------------------------------------------

export const csvImports = pgTable(
  'csv_imports',
  {
    id: id(),
    tenantId: tenantId(),
    uploadedByUserId: uuid('uploaded_by_user_id')
      .notNull()
      .references(() => users.id),
    filename: text('filename').notNull(),
    totalRows: integer('total_rows').notNull(),
    importedCount: integer('imported_count').notNull().default(0),
    skippedCount: integer('skipped_count').notNull().default(0),
    errors: jsonb('errors').notNull().default(sql`'[]'::jsonb`),
    status: text('status').notNull().default('processing'),
    createdAt: createdAt(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => [
    check('csv_imports_status_chk', sql`${t.status} in ('processing','complete','failed')`),
    index('idx_csv_imports_tenant').on(t.tenantId, t.createdAt.desc()),
  ],
);

// --- admin_users ------------------------------------------------------------

export const adminUsers = pgTable(
  'admin_users',
  {
    id: id(),
    clerkUserId: text('clerk_user_id').notNull().unique(),
    email: text('email').notNull(),
    fullName: text('full_name'),
    role: text('role').notNull().default('admin'),
    createdAt: createdAt(),
  },
  (t) => [check('admin_users_role_chk', sql`${t.role} in ('admin','support')`)],
);

// --- admin_audit_log --------------------------------------------------------

export const adminAuditLog = pgTable(
  'admin_audit_log',
  {
    id: id(),
    adminUserId: uuid('admin_user_id')
      .notNull()
      .references(() => adminUsers.id),
    tenantIdAccessed: uuid('tenant_id_accessed').references(() => tenants.id),
    action: text('action').notNull(),
    resource: text('resource'),
    resourceId: uuid('resource_id'),
    metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
    ipAddress: inet('ip_address'),
    createdAt: createdAt(),
  },
  (t) => [
    index('idx_admin_audit_user_created').on(t.adminUserId, t.createdAt.desc()),
    index('idx_admin_audit_tenant_created').on(t.tenantIdAccessed, t.createdAt.desc()),
  ],
);

// --- types ------------------------------------------------------------------

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type CsvImport = typeof csvImports.$inferSelect;
export type NewCsvImport = typeof csvImports.$inferInsert;
export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;
export type AdminAuditLog = typeof adminAuditLog.$inferSelect;
export type NewAdminAuditLog = typeof adminAuditLog.$inferInsert;
