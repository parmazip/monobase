CREATE TABLE IF NOT EXISTS "review" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_by" uuid,
	"context_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"review_type" varchar(50) NOT NULL,
	"reviewed_entity_id" uuid,
	"nps_score" integer NOT NULL,
	"comment" text,
	CONSTRAINT "reviews_context_reviewer_type_unique" UNIQUE("context_id","reviewer_id","review_type"),
	CONSTRAINT "reviews_nps_score_check" CHECK ("review"."nps_score" >= 0 AND "review"."nps_score" <= 10),
	CONSTRAINT "reviews_comment_check" CHECK (LENGTH("review"."comment") <= 1000),
	CONSTRAINT "reviews_review_type_check" CHECK (LENGTH("review"."review_type") <= 50)
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "review" ADD CONSTRAINT "review_reviewer_id_person_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."person"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "review" ADD CONSTRAINT "review_reviewed_entity_id_person_id_fk" FOREIGN KEY ("reviewed_entity_id") REFERENCES "public"."person"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reviews_context_idx" ON "review" USING btree ("context_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reviews_reviewer_idx" ON "review" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reviews_review_type_idx" ON "review" USING btree ("review_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reviews_reviewed_entity_idx" ON "review" USING btree ("reviewed_entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reviews_deleted_at_idx" ON "review" USING btree ("deleted_at");