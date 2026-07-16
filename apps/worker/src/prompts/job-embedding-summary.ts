import { z } from "zod";

// Used only by the backfill script, for jobs saved before embeddingSummary
// existed (apps/worker/src/prompts/job-posting-extraction.ts generates it
// inline for new scrapes). Same instruction, applied after the fact.
export const EMBEDDING_SUMMARY_SYSTEM = `You are a precise summarization assistant. Given a job title, description, and requirements (which may be in Indonesian or English), return ONLY a JSON object: { "embeddingSummary": string }. The summary must be 2-4 sentences in ENGLISH: the role title, seniority level if apparent, and the 3-6 most important required skills/tools. Translate if the source text is in Indonesian. Written for semantic search, not for display. No markdown, no extra text.`;

export const EmbeddingSummarySchema = z.object({
  embeddingSummary: z.string(),
});

export function embeddingSummaryUser(job: {
  title: string;
  description: string | null;
  requirements: string | null;
}): string {
  return JSON.stringify({
    title: job.title,
    description: job.description,
    requirements: job.requirements,
  });
}
