import { z } from "zod";

// Validates (and normalizes with defaults) the DeepSeek resume-parse output.
export const ResumeParseSchema = z.object({
  skills: z.array(z.string()).default([]),
  jobTitles: z.array(z.string()).default([]),
  seniority: z.string().nullable().default(null),
  yearsExperience: z.number().nullable().default(null),
  locationPref: z.string().nullable().default(null),
  summary: z.string().nullable().default(null),
});

export type ResumeParse = z.infer<typeof ResumeParseSchema>;

export const RESUME_PARSE_SYSTEM = `You are an expert technical recruiter extracting a structured profile from a candidate's resume.

Return ONLY a JSON object with exactly these keys:
- "skills": string[] — concrete hard skills, tools, languages, frameworks (e.g. "React", "PostgreSQL", "Figma"). Deduplicated, most relevant first.
- "jobTitles": string[] — role titles the candidate is a fit for, based on their experience (e.g. "Frontend Engineer", "Product Designer").
- "seniority": one of "entry", "mid", "senior", "lead", "executive", or null if unclear.
- "yearsExperience": total years of professional experience as a number, or null if unclear.
- "locationPref": preferred/current location as a short string, or null.
- "summary": a 1-3 sentence plain-text summary of the candidate's background and strengths.

Rules:
- Output valid JSON only, no markdown, no commentary.
- Never invent skills or titles not supported by the resume.
- If the text is not a resume, return empty arrays and null fields.
- All output text (skills, jobTitles, summary) MUST be in English, regardless of
  the resume's original language. Translate the meaning while extracting — do not
  add a separate translation pass.`;

export function resumeParseUser(resumeText: string): string {
  return `Resume text:\n\n${resumeText}`;
}
