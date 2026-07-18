import { DEEPSEEK_MODEL, callDeepseekJson, embedText } from "@repo/ai";
import { type JobEmbeddingMatch, jobRepo, resumeRepo } from "@repo/db";
import { EXPLAIN_SYSTEM, ExplainSchema, explainUser } from "./prompts/explain.js";
import { RERANK_SYSTEM, RerankSchema, rerankUser } from "./prompts/rerank.js";
import {
  RESUME_PARSE_SYSTEM,
  type ResumeParse,
  ResumeParseSchema,
  resumeParseUser,
} from "./prompts/resume-parse.js";
import type { ExplainResponse, MatchRequest, MatchResponse, MatchedJob } from "./resume.schema.js";

// The sole "is this résumé even related to any job?" gate — below this, we show
// no results rather than padding with irrelevant nearest-neighbors. NOT a
// calibrated cutoff. The DeepSeek rerank below is the authoritative relevance
// ordering *among* jobs that clear this bar. Calibrate on labeled resume/job
// pairs before trusting this number (see plan D4).
const SIMILARITY_THRESHOLD = 0.35;
const CANDIDATE_LIMIT = 10;

function toMatchedJob(match: JobEmbeddingMatch): MatchedJob {
  const { job, score } = match;
  return {
    id: job.id,
    title: job.title,
    companyName: job.companyName,
    locationRaw: job.locationRaw,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryCurrency: job.salaryCurrency,
    salaryPeriod: job.salaryPeriod,
    sourceUrl: job.sourceUrl,
    score,
  };
}

// Stage 4 — reorder the shortlist with DeepSeek against the candidate profile.
// Fails open: any error returns the vector order unchanged so a rerank hiccup
// never breaks search.
async function rerankMatches(
  profile: ResumeParse,
  matches: JobEmbeddingMatch[]
): Promise<JobEmbeddingMatch[]> {
  if (matches.length <= 1) return matches;
  try {
    const raw = await callDeepseekJson({
      model: DEEPSEEK_MODEL,
      system: RERANK_SYSTEM,
      user: rerankUser({
        profile,
        jobs: matches.map((m) => ({
          id: m.job.id,
          title: m.job.title,
          snippet: (m.job.description ?? m.job.requirements ?? "").slice(0, 400),
        })),
      }),
    });
    const { rankedIds } = RerankSchema.parse(raw);
    const byId = new Map(matches.map((m) => [m.job.id, m]));
    const reordered = rankedIds
      .map((id) => byId.get(id))
      .filter((m): m is JobEmbeddingMatch => Boolean(m));
    // Append anything the model dropped, preserving original order.
    for (const m of matches) {
      if (!rankedIds.includes(m.job.id)) reordered.push(m);
    }
    return reordered.length > 0 ? reordered : matches;
  } catch (error) {
    console.log("resume.rerank.failed", JSON.stringify({ error: String(error) }));
    return matches;
  }
}

export const resumeService = {
  matchResume: async (input: MatchRequest): Promise<MatchResponse> => {
    console.log("resume.matchResume", JSON.stringify({ len: input.resumeText.length }));

    // 1. Parse the resume into a structured profile (DeepSeek).
    const parsedRaw = await callDeepseekJson({
      model: DEEPSEEK_MODEL,
      system: RESUME_PARSE_SYSTEM,
      user: resumeParseUser(input.resumeText),
    });
    const profile = ResumeParseSchema.parse(parsedRaw);

    // 2. Embed a distilled candidate document (symmetry with how jobs are embedded).
    const queryText = [
      profile.jobTitles.join(", "),
      profile.skills.join(", "),
      profile.summary ?? "",
    ]
      .filter(Boolean)
      .join("\n");
    const embedding = await embedText(queryText || input.resumeText.slice(0, 2000));

    // 3. Vector search with cheap SQL pre-filters.
    let matches = await jobRepo.searchByEmbedding(embedding, {
      limit: CANDIDATE_LIMIT,
      locations: input.locations,
      minSalary: input.minSalary,
    });
    let fallbackUsed: MatchResponse["fallbackUsed"] = "none";

    // Fallback 1: pre-filters excluded everything → drop them and retry.
    if (matches.length === 0 && (input.locations?.length || input.minSalary)) {
      matches = await jobRepo.searchByEmbedding(embedding, { limit: CANDIDATE_LIMIT });
      fallbackUsed = "relaxed-filters";
    }

    // Only jobs clearing the relevance bar are ever returned — a résumé
    // unrelated to every candidate yields an empty result, not a padded list
    // of irrelevant nearest-neighbors.
    const strong = matches.filter((m) => m.score >= SIMILARITY_THRESHOLD);
    const weakMatch = strong.length === 0;
    let chosen = strong;

    // 4. Rerank (authoritative relevance ordering).
    chosen = await rerankMatches(profile, chosen);

    // 5. Persist the resume + its matches.
    const resumeId = await resumeRepo.create({
      fileName: input.fileName ?? null,
      rawText: input.resumeText,
      profile,
      embedding,
      weakMatch,
    });
    await resumeRepo.saveMatches(
      resumeId,
      chosen.map((m, i) => ({ jobId: m.job.id, score: m.score, rank: i + 1 }))
    );

    console.log(
      "resume.matchResume.done",
      JSON.stringify({ resumeId, items: chosen.length, weakMatch, fallbackUsed })
    );
    return { resumeId, profile, items: chosen.map(toMatchedJob), weakMatch, fallbackUsed };
  },

  // On-demand RAG explanation for one job against a previously-parsed resume.
  explainMatch: async (jobId: string, resumeId: string): Promise<ExplainResponse | null> => {
    console.log("resume.explainMatch", JSON.stringify({ jobId, resumeId }));
    const [resume, job] = await Promise.all([
      resumeRepo.findById(resumeId),
      jobRepo.findById(jobId),
    ]);
    if (!resume || !job) return null;

    const raw = await callDeepseekJson({
      model: DEEPSEEK_MODEL,
      system: EXPLAIN_SYSTEM,
      user: explainUser({
        profile: resume.profile,
        job: { title: job.title, description: job.description, requirements: job.requirements },
      }),
    });
    const parsed = ExplainSchema.parse(raw);
    return { jobId, ...parsed };
  },
};
