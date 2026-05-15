CREATE TABLE "admin_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_user_id" uuid NOT NULL,
	"tenant_id_accessed" uuid,
	"action" text NOT NULL,
	"resource" text,
	"resource_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip_address" "inet",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"role" text DEFAULT 'admin' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_clerk_user_id_unique" UNIQUE("clerk_user_id"),
	CONSTRAINT "admin_users_role_chk" CHECK ("admin_users"."role" in ('admin','support'))
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_message_preview" text,
	"last_message_direction" text,
	"unread_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversations_last_direction_chk" CHECK ("conversations"."last_message_direction" is null or "conversations"."last_message_direction" in ('inbound','outbound'))
);
--> statement-breakpoint
CREATE TABLE "csv_imports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"uploaded_by_user_id" uuid NOT NULL,
	"filename" text NOT NULL,
	"total_rows" integer NOT NULL,
	"imported_count" integer DEFAULT 0 NOT NULL,
	"skipped_count" integer DEFAULT 0 NOT NULL,
	"errors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'processing' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "csv_imports_status_chk" CHECK ("csv_imports"."status" in ('processing','complete','failed'))
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"channel" text NOT NULL,
	"direction" text NOT NULL,
	"body_text" text NOT NULL,
	"body_html" text,
	"subject" text,
	"twilio_sid" text,
	"twilio_from" text,
	"twilio_to" text,
	"segments" integer,
	"price_cents" integer,
	"email_message_id" text,
	"email_in_reply_to" text,
	"email_references" text,
	"status" text DEFAULT 'queued' NOT NULL,
	"status_updated_at" timestamp with time zone,
	"error_code" text,
	"sent_by_user_id" uuid,
	"sent_at" timestamp with time zone,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "messages_twilio_sid_unique" UNIQUE("twilio_sid"),
	CONSTRAINT "messages_channel_chk" CHECK ("messages"."channel" in ('sms','email')),
	CONSTRAINT "messages_direction_chk" CHECK ("messages"."direction" in ('inbound','outbound')),
	CONSTRAINT "messages_status_chk" CHECK ("messages"."status" in ('queued','sent','delivered','undelivered','failed','received','bounced','complained'))
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"external_patient_id" text,
	"first_name" text,
	"last_name" text,
	"phone" text,
	"email" text,
	"last_visit_date" date,
	"last_service" text,
	"enrollment_date" date,
	"sequence_track" text,
	"status" text DEFAULT 'new' NOT NULL,
	"last_contacted_at" timestamp with time zone,
	"last_message_number" integer,
	"channel_last_used" text,
	"replied" boolean DEFAULT false NOT NULL,
	"booking_link_clicked" boolean DEFAULT false NOT NULL,
	"opted_out" boolean DEFAULT false NOT NULL,
	"opted_out_at" timestamp with time zone,
	"converted" boolean DEFAULT false NOT NULL,
	"estimated_revenue_cents" integer,
	"notes" text,
	"source" text DEFAULT 'csv' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "patients_sequence_track_chk" CHECK ("patients"."sequence_track" is null or "patients"."sequence_track" in ('60_day','90_day','120_day')),
	CONSTRAINT "patients_status_chk" CHECK ("patients"."status" in ('new','enrolled','replied','converted','opted_out','no_response','sequence_complete')),
	CONSTRAINT "patients_channel_last_used_chk" CHECK ("patients"."channel_last_used" is null or "patients"."channel_last_used" in ('sms','email')),
	CONSTRAINT "patients_source_chk" CHECK ("patients"."source" in ('csv','boulevard','mangomint','manual'))
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_org_id" text NOT NULL,
	"name" text NOT NULL,
	"subdomain" text,
	"timezone" text DEFAULT 'America/Los_Angeles' NOT NULL,
	"twilio_from_number" text,
	"twilio_account_sid_ref" text,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_clerk_org_id_unique" UNIQUE("clerk_org_id"),
	CONSTRAINT "tenants_subdomain_unique" UNIQUE("subdomain"),
	CONSTRAINT "tenants_status_chk" CHECK ("tenants"."status" in ('active','suspended'))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"role" text DEFAULT 'operator' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_user_id_unique" UNIQUE("clerk_user_id"),
	CONSTRAINT "users_role_chk" CHECK ("users"."role" in ('owner','operator'))
);
--> statement-breakpoint
ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_tenant_id_accessed_tenants_id_fk" FOREIGN KEY ("tenant_id_accessed") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "csv_imports" ADD CONSTRAINT "csv_imports_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "csv_imports" ADD CONSTRAINT "csv_imports_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sent_by_user_id_users_id_fk" FOREIGN KEY ("sent_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_admin_audit_user_created" ON "admin_audit_log" USING btree ("admin_user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_admin_audit_tenant_created" ON "admin_audit_log" USING btree ("tenant_id_accessed","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "idx_conversations_tenant_patient" ON "conversations" USING btree ("tenant_id","patient_id");--> statement-breakpoint
CREATE INDEX "idx_conversations_tenant_activity" ON "conversations" USING btree ("tenant_id","last_activity_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_csv_imports_tenant" ON "csv_imports" USING btree ("tenant_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_messages_tenant_conv" ON "messages" USING btree ("tenant_id","conversation_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_messages_tenant_patient" ON "messages" USING btree ("tenant_id","patient_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_messages_status_pending" ON "messages" USING btree ("status") WHERE "messages"."status" in ('queued','sent');--> statement-breakpoint
CREATE INDEX "idx_patients_tenant" ON "patients" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_patients_tenant_phone" ON "patients" USING btree ("tenant_id","phone") WHERE "patients"."phone" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_patients_tenant_external" ON "patients" USING btree ("tenant_id","external_patient_id") WHERE "patients"."external_patient_id" is not null;--> statement-breakpoint
CREATE INDEX "idx_patients_tenant_status" ON "patients" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_tenants_subdomain" ON "tenants" USING btree ("subdomain") WHERE "tenants"."subdomain" is not null;--> statement-breakpoint
CREATE INDEX "idx_users_tenant" ON "users" USING btree ("tenant_id");