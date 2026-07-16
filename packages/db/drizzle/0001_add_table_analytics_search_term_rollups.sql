CREATE TYPE "public"."analytics_event_type" AS ENUM('visit', 'search', 'job_view', 'apply_click');--> statement-breakpoint
CREATE TABLE "analytics_daily_rollups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day" date NOT NULL,
	"visit_count" integer DEFAULT 0 NOT NULL,
	"unique_visitor_count" integer DEFAULT 0 NOT NULL,
	"search_count" integer DEFAULT 0 NOT NULL,
	"job_view_count" integer DEFAULT 0 NOT NULL,
	"apply_click_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "analytics_daily_rollups_day_unique" UNIQUE("day")
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" "analytics_event_type" NOT NULL,
	"visitor_id" text NOT NULL,
	"session_id" text NOT NULL,
	"path" text,
	"job_id" uuid,
	"search_query" text,
	"search_filters" jsonb,
	"is_zero_result" boolean,
	"metadata" jsonb,
	"ip_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_job_engagement_rollups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day" date NOT NULL,
	"job_id" uuid NOT NULL,
	"job_view_count" integer DEFAULT 0 NOT NULL,
	"apply_click_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "analytics_job_engagement_rollups_day_job_unique" UNIQUE("day","job_id")
);
--> statement-breakpoint
CREATE TABLE "analytics_search_term_rollups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day" date NOT NULL,
	"normalized_term" text NOT NULL,
	"search_count" integer DEFAULT 0 NOT NULL,
	"zero_result_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "analytics_search_term_rollups_day_term_unique" UNIQUE("day","normalized_term")
);
--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_job_engagement_rollups" ADD CONSTRAINT "analytics_job_engagement_rollups_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_events_type_created_at_idx" ON "analytics_events" USING btree ("event_type","created_at");--> statement-breakpoint
CREATE INDEX "analytics_events_job_visitor_created_idx" ON "analytics_events" USING btree ("job_id","visitor_id","created_at");--> statement-breakpoint
CREATE INDEX "analytics_events_session_created_idx" ON "analytics_events" USING btree ("session_id","created_at");