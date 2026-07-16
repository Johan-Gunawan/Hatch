// The single canonical way to turn a job into the text we embed. Used by BOTH
// the backfill script and the scrape hook so the vector for a job is identical
// however it was produced — keeping the index consistent.
//
// Prefers the English-normalized embeddingSummary (see job-posting-extraction.ts)
// so Indonesian and English postings land in the same region of embedding space
// as an English-normalized resume profile (see resume-parse.ts). Falls back to
// raw description+requirements only for rows from before this field existed.
export function buildJobEmbeddingText(job: {
  title: string;
  embeddingSummary?: string | null;
  description?: string | null;
  requirements?: string | null;
}): string {
  if (job.embeddingSummary) {
    return [job.title, job.embeddingSummary].join("\n\n").trim();
  }
  return [job.title, job.description ?? "", job.requirements ?? ""]
    .filter(Boolean)
    .join("\n\n")
    .trim();
}
