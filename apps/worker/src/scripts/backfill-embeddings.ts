import { DEEPSEEK_MODEL, callDeepseekJson, embedBatch } from "@repo/ai";
import { jobRepo } from "@repo/db";
import type { JobModel } from "@repo/db";
import { buildJobEmbeddingText } from "../lib/embedding-source-text.js";
import {
  EMBEDDING_SUMMARY_SYSTEM,
  EmbeddingSummarySchema,
  embeddingSummaryUser,
} from "../prompts/job-embedding-summary.js";

// One-off, idempotent, resumable backfill: embed every job that doesn't yet have
// an embedding. Only selects rows where embedding IS NULL, so a crash mid-run
// just resumes on the next run. Run with: pnpm --filter @repo/worker embed:backfill
const BATCH = 100;
// DeepSeek has no batch-JSON endpoint (unlike embedBatch's single OpenAI call),
// so summary generation is bounded-concurrency, not one call for the whole batch.
const SUMMARY_CONCURRENCY = 5;

// Generates and persists the English embeddingSummary for jobs saved before
// this field existed. Fails open — buildJobEmbeddingText falls back to raw
// description+requirements if this returns null, so a summarization hiccup
// never blocks the embed step.
async function ensureEmbeddingSummary(job: JobModel): Promise<string | null> {
  if (job.embeddingSummary) return job.embeddingSummary;
  try {
    const raw = await callDeepseekJson({
      model: DEEPSEEK_MODEL,
      system: EMBEDDING_SUMMARY_SYSTEM,
      user: embeddingSummaryUser(job),
    });
    const { embeddingSummary } = EmbeddingSummarySchema.parse(raw);
    await jobRepo.update(job.id, { embeddingSummary });
    return embeddingSummary;
  } catch (error) {
    console.log("backfill.summary-failed", JSON.stringify({ id: job.id, error: String(error) }));
    return null;
  }
}

async function ensureEmbeddingSummaries(rows: JobModel[]): Promise<(string | null)[]> {
  const results: (string | null)[] = new Array(rows.length).fill(null);
  for (let i = 0; i < rows.length; i += SUMMARY_CONCURRENCY) {
    const slice = rows.slice(i, i + SUMMARY_CONCURRENCY);
    const summaries = await Promise.all(slice.map(ensureEmbeddingSummary));
    for (const [j, summary] of summaries.entries()) results[i + j] = summary;
  }
  return results;
}

async function main() {
  let total = 0;
  while (true) {
    const rows = await jobRepo.findWithoutEmbedding(BATCH);
    if (rows.length === 0) break;

    const summaries = await ensureEmbeddingSummaries(rows);
    const texts = rows.map((job, i) =>
      buildJobEmbeddingText({ ...job, embeddingSummary: summaries[i] })
    );
    const vectors = await embedBatch(texts);
    await jobRepo.setEmbeddingsBatch(rows.map((job, i) => ({ id: job.id, embedding: vectors[i] })));

    total += rows.length;
    console.log("backfill.progress", JSON.stringify({ total }));
  }
  console.log("backfill.done", JSON.stringify({ total }));
  process.exit(0);
}

main().catch((error) => {
  console.error("backfill.error", error);
  process.exit(1);
});
