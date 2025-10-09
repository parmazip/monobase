CREATE TYPE "public"."audit_action" AS ENUM('create', 'read', 'update', 'delete', 'login', 'logout');--> statement-breakpoint
CREATE TYPE "public"."audit_category" AS ENUM('hipaa', 'security', 'privacy', 'administrative', 'clinical', 'financial');--> statement-breakpoint
CREATE TYPE "public"."audit_event_type" AS ENUM('authentication', 'data-access', 'data-modification', 'system-config', 'security', 'compliance');--> statement-breakpoint
CREATE TYPE "public"."audit_outcome" AS ENUM('success', 'failure', 'partial', 'denied');--> statement-breakpoint
CREATE TYPE "public"."audit_retention_status" AS ENUM('active', 'archived', 'pending-purge');--> statement-breakpoint
CREATE TYPE "public"."chat_room_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."message_type" AS ENUM('text', 'system', 'video_call');--> statement-breakpoint
CREATE TYPE "public"."participant_type" AS ENUM('patient', 'provider');--> statement-breakpoint
CREATE TYPE "public"."video_call_status" AS ENUM('starting', 'active', 'ended', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."email_provider" AS ENUM('smtp', 'postmark', 'onesignal');--> statement-breakpoint
CREATE TYPE "public"."email_queue_status" AS ENUM('pending', 'processing', 'sent', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."template_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."variable_type" AS ENUM('string', 'number', 'boolean', 'date', 'datetime', 'url', 'email', 'array');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('email', 'push', 'in-app');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('queued', 'sent', 'delivered', 'read', 'failed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('security', 'system');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'non-binary', 'other', 'prefer-not-to-say');--> statement-breakpoint
CREATE TYPE "public"."file_status" AS ENUM('uploading', 'processing', 'available', 'failed');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "apikey" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"start" text,
	"prefix" text,
	"key" text NOT NULL,
	"user_id" text NOT NULL,
	"refill_interval" integer,
	"refill_amount" integer,
	"last_refill_at" timestamp,
	"enabled" boolean DEFAULT true,
	"rate_limit_enabled" boolean DEFAULT true,
	"rate_limit_time_window" integer DEFAULT 86400000,
	"rate_limit_max" integer DEFAULT 10,
	"request_count" integer DEFAULT 0,
	"remaining" integer,
	"last_request" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"permissions" text,
	"metadata" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "passkey" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"public_key" text NOT NULL,
	"user_id" text NOT NULL,
	"credential_id" text NOT NULL,
	"counter" integer NOT NULL,
	"device_type" text NOT NULL,
	"backed_up" boolean NOT NULL,
	"transports" text,
	"created_at" timestamp,
	"aaguid" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "two_factor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	"two_factor_enabled" boolean DEFAULT false,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_log_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_by" uuid,
	"event_type" "audit_event_type" NOT NULL,
	"category" "audit_category" NOT NULL,
	"action" "audit_action" NOT NULL,
	"outcome" "audit_outcome" NOT NULL,
	"user" uuid,
	"user_type" varchar(20),
	"resource_type" varchar(100) NOT NULL,
	"resource" varchar(255) NOT NULL,
	"description" varchar(1000) NOT NULL,
	"details" jsonb,
	"ip_address" varchar(45),
	"user_agent" varchar(500),
	"session_id" varchar(255),
	"request_id" varchar(255),
	"integrity_hash" varchar(64),
	"retention_status" "audit_retention_status" DEFAULT 'active' NOT NULL,
	"archived_at" timestamp,
	"archived_by" text,
	"purge_after" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_by" uuid,
	"chat_room_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"message_type" "message_type" NOT NULL,
	"message" text,
	"video_call_data" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_room" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_by" uuid,
	"participants" jsonb NOT NULL,
	"admins" jsonb NOT NULL,
	"context_id" uuid,
	"status" "chat_room_status" DEFAULT 'active' NOT NULL,
	"last_message_at" timestamp,
	"message_count" integer DEFAULT 0 NOT NULL,
	"active_video_call_message_id" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_by" uuid,
	"template" uuid,
	"template_tags" jsonb,
	"recipient_email" varchar(255) NOT NULL,
	"recipient_name" varchar(255),
	"variables" jsonb NOT NULL,
	"metadata" jsonb,
	"status" "email_queue_status" DEFAULT 'pending' NOT NULL,
	"priority" integer DEFAULT 5 NOT NULL,
	"scheduled_at" timestamp,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp,
	"next_retry_at" timestamp,
	"last_error" text,
	"sent_at" timestamp,
	"provider" "email_provider",
	"provider_message_id" varchar(255),
	"cancelled_at" timestamp,
	"cancelled_by" uuid,
	"cancellation_reason" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_by" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"subject" varchar(500) NOT NULL,
	"body_html" text NOT NULL,
	"body_text" text,
	"tags" jsonb,
	"variables" jsonb NOT NULL,
	"from_name" varchar(255),
	"from_email" varchar(255),
	"reply_to_email" varchar(255),
	"reply_to_name" varchar(255),
	"status" "template_status" DEFAULT 'draft' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_by" uuid,
	"recipient_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"title" varchar(200) NOT NULL,
	"message" varchar(1000) NOT NULL,
	"scheduled_at" timestamp,
	"related_entity_type" varchar(50),
	"related_entity" uuid,
	"status" "notification_status" DEFAULT 'queued' NOT NULL,
	"sent_at" timestamp,
	"read_at" timestamp,
	"consent_validated" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "person" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_by" uuid,
	"first_name" varchar(50) NOT NULL,
	"last_name" varchar(50),
	"middle_name" varchar(50),
	"date_of_birth" date,
	"gender" "gender",
	"primary_address" jsonb,
	"contact_info" jsonb,
	"avatar" jsonb,
	"languages_spoken" jsonb,
	"timezone" varchar(50)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stored_file" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_by" uuid,
	"filename" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"size" bigint NOT NULL,
	"status" "file_status" DEFAULT 'uploading' NOT NULL,
	"owner" uuid NOT NULL,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "apikey" ADD CONSTRAINT "apikey_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "passkey" ADD CONSTRAINT "passkey_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_log_entry" ADD CONSTRAINT "audit_log_entry_archived_by_user_id_fk" FOREIGN KEY ("archived_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_chat_room_id_chat_room_id_fk" FOREIGN KEY ("chat_room_id") REFERENCES "public"."chat_room"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_queue" ADD CONSTRAINT "email_queue_template_email_template_id_fk" FOREIGN KEY ("template") REFERENCES "public"."email_template"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_event_type_idx" ON "audit_log_entry" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_category_idx" ON "audit_log_entry" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_user_idx" ON "audit_log_entry" USING btree ("user");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_resource_idx" ON "audit_log_entry" USING btree ("resource_type","resource");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_created_at_idx" ON "audit_log_entry" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_retention_status_idx" ON "audit_log_entry" USING btree ("retention_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_user_event_idx" ON "audit_log_entry" USING btree ("user","event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_resource_type_event_idx" ON "audit_log_entry" USING btree ("resource_type","event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_date_range_idx" ON "audit_log_entry" USING btree ("created_at","retention_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_messages_chat_room_idx" ON "chat_message" USING btree ("chat_room_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_messages_sender_idx" ON "chat_message" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_messages_timestamp_idx" ON "chat_message" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_messages_type_idx" ON "chat_message" USING btree ("message_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_messages_deleted_at_idx" ON "chat_message" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_messages_room_timestamp_idx" ON "chat_message" USING btree ("chat_room_id","timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_messages_room_type_idx" ON "chat_message" USING btree ("chat_room_id","message_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_messages_sender_timestamp_idx" ON "chat_message" USING btree ("sender_id","timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_rooms_participants_idx" ON "chat_room" USING gin ("participants");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_rooms_admins_idx" ON "chat_room" USING gin ("admins");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_rooms_context_idx" ON "chat_room" USING btree ("context_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_rooms_status_idx" ON "chat_room" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_rooms_last_message_at_idx" ON "chat_room" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_rooms_active_video_call_idx" ON "chat_room" USING btree ("active_video_call_message_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_rooms_deleted_at_idx" ON "chat_room" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_rooms_status_last_message_idx" ON "chat_room" USING btree ("status","last_message_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_queue_status_idx" ON "email_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_queue_priority_idx" ON "email_queue" USING btree ("priority");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_queue_scheduled_idx" ON "email_queue" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_queue_recipient_idx" ON "email_queue" USING btree ("recipient_email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_queue_template_idx" ON "email_queue" USING btree ("template");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_queue_template_tags_idx" ON "email_queue" USING gin ("template_tags");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_queue_processing_idx" ON "email_queue" USING btree ("status","priority","scheduled_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_template_status_idx" ON "email_template" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_template_tags_idx" ON "email_template" USING gin ("tags");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_recipient_status_idx" ON "notification" USING btree ("recipient_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_scheduled_status_idx" ON "notification" USING btree ("scheduled_at","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_type_channel_idx" ON "notification" USING btree ("type","channel");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_created_at_idx" ON "notification" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_deleted_at_idx" ON "notification" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "persons_name_idx" ON "person" USING btree ("first_name","last_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "persons_deleted_at_idx" ON "person" USING btree ("deleted_at");