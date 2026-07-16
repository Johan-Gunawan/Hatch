import { boolean, integer, jsonb, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { jobs } from "./jobs.js";
import { vector } from "./vector.js";

// Structured profile extracted from the uploaded resume text by the LLM.
// Stored as JSONB so the shape can evolve without a migration.
export interface ResumeProfile {
  skills: string[];
  jobTitles: string[];
  seniority: string | null;
  yearsExperience?: number | null;
  locationPref?: string | null;
  summary?: string | null;
}

export const resumes = pgTable("resumes", {
  id: uuid("id").primaryKey().defaultRandom(),
  fileName: text("file_name"),
  // Raw extracted resume text. NOTE: this is PII — mind retention.
  rawText: text("raw_text").notNull(),
  profile: jsonb("profile").$type<ResumeProfile>().notNull(),
  // Reusable query embedding → re-match later without another OpenAI call.
  embedding: vector("embedding"),
  weakMatch: boolean("weak_match").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const resumeMatches = pgTable("resume_matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  resumeId: uuid("resume_id")
    .notNull()
    .references(() => resumes.id, { onDelete: "cascade" }),
  jobId: uuid("job_id")
    .notNull()
    .references(() => jobs.id),
  score: real("score").notNull(),
  rank: integer("rank").notNull(), // post-rerank position, 1-based
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ResumeModel = typeof resumes.$inferSelect;
export type NewResumeModel = typeof resumes.$inferInsert;
export type ResumeMatchModel = typeof resumeMatches.$inferSelect;
export type NewResumeMatchModel = typeof resumeMatches.$inferInsert;
