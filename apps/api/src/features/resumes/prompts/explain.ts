import { z } from "zod";

export const ExplainSchema = z.object({
  summary: z.string(),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
});

export const EXPLAIN_SYSTEM = `You are a career coach explaining, to a candidate, why a specific job does or doesn't fit them.

You receive the candidate profile and one job (title, description, requirements). Ground every statement in the provided text — do not invent requirements or skills.

Return ONLY a JSON object:
- "summary": 1-2 sentence plain-text verdict on the fit.
- "strengths": string[] — specific reasons the candidate matches (skills/experience that line up).
- "gaps": string[] — requirements the candidate may not meet, or unknowns. Empty array if none.

No markdown, no commentary.`;

export interface ExplainJobInput {
  title: string;
  description: string | null;
  requirements: string | null;
}

export function explainUser(input: { profile: unknown; job: ExplainJobInput }): string {
  return JSON.stringify(input);
}
