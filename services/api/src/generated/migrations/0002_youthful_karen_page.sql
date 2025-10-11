CREATE TABLE IF NOT EXISTS "provider" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_by" uuid,
	"person_id" uuid NOT NULL,
	"provider_type" varchar(50) NOT NULL,
	"years_of_experience" integer,
	"biography" text,
	"minor_ailments_specialties" jsonb,
	"minor_ailments_practice_locations" jsonb,
	CONSTRAINT "providers_person_id_unique" UNIQUE("person_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "provider" ADD CONSTRAINT "provider_person_id_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."person"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "providers_person_id_idx" ON "provider" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "providers_deleted_at_idx" ON "provider" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "providers_provider_type_idx" ON "provider" USING btree ("provider_type");