import { z } from "zod";
import type { ResumeParse } from "./resume-parse.js";

export const RerankSchema = z.object({
  rankedIds: z.array(z.string()),
});

export const RERANK_SYSTEM = `You are a technical recruiter re-ranking a shortlist of jobs for a candidate.

You receive a candidate profile and a list of jobs (each with an id, title, and short snippet). Reorder the jobs from BEST to WORST fit for this candidate, weighing skill overlap, title/seniority alignment, and domain relevance.

Return ONLY a JSON object: { "rankedIds": string[] } listing every provided job id exactly once, best first. No markdown, no commentary.`;

export interface RerankJobInput {
  id: string;
  title: string;
  snippet: string;
}

export function rerankUser(input: { profile: ResumeParse; jobs: RerankJobInput[] }): string {
  return JSON.stringify(input);
}
