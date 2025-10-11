ALTER TABLE "booking_event" ADD COLUMN IF NOT EXISTS "keywords" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "booking_event" ADD COLUMN IF NOT EXISTS "tags" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "booking_events_search_idx" ON "booking_event" USING gin (to_tsvector('english', "title" || ' ' || COALESCE("description", '')));--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "booking_events_keywords_idx" ON "booking_event" USING gin ("keywords");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "booking_events_tags_idx" ON "booking_event" USING gin ("tags");