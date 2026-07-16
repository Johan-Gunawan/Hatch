CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TABLE "resume_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resume_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"score" real NOT NULL,
	"rank" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resumes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_name" text,
	"raw_text" text NOT NULL,
	"profile" jsonb NOT NULL,
	"embedding" vector(1536),
	"weak_match" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "embedding" vector(1536);--> statement-breakpoint
ALTER TABLE "resume_matches" ADD CONSTRAINT "resume_matches_resume_id_resumes_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resume_matches" ADD CONSTRAINT "resume_matches_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- HNSW index for cosine-distance (`<=>`) semantic search over job embeddings.
-- vector_cosine_ops pairs with the `<=>` operator used in JobRepository.searchByEmbedding.
CREATE INDEX IF NOT EXISTS "jobs_embedding_hnsw" ON "jobs" USING hnsw ("embedding" vector_cosine_ops);