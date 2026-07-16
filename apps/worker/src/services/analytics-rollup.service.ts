import type {
  AnalyticsEventModel,
  DailyCounts,
  JobEngagementCounts,
  SearchTermCounts,
} from "@repo/db";

export function normalizeSearchTerm(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

export function aggregateDailyCounts(events: AnalyticsEventModel[]): DailyCounts {
  const visitorIds = new Set<string>();
  let visitCount = 0;
  let searchCount = 0;
  let jobViewCount = 0;
  let applyClickCount = 0;

  for (const event of events) {
    visitorIds.add(event.visitorId);

    switch (event.eventType) {
      case "visit":
        visitCount++;
        break;
      case "search":
        searchCount++;
        break;
      case "job_view":
        jobViewCount++;
        break;
      case "apply_click":
        applyClickCount++;
        break;
    }
  }

  const counts: DailyCounts = {
    visitCount,
    uniqueVisitorCount: visitorIds.size,
    searchCount,
    jobViewCount,
    applyClickCount,
  };

  console.log("aggregate-daily-counts", counts);
  return counts;
}

// Early-exit edit distance — we only care whether the distance is exactly 1, so
// bail out as soon as the running distance exceeds that.
function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 1) return 2;

  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));

  for (let i = 0; i < rows; i++) matrix[i][0] = i;
  for (let j = 0; j < cols; j++) matrix[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[rows - 1][cols - 1];
}

export function aggregateSearchTerms(events: AnalyticsEventModel[]): Map<string, SearchTermCounts> {
  const exact = new Map<string, SearchTermCounts>();

  for (const event of events) {
    if (event.eventType !== "search" || event.searchQuery === null) continue;

    const term = normalizeSearchTerm(event.searchQuery);
    const existing = exact.get(term) ?? { searchCount: 0, zeroResultCount: 0 };
    existing.searchCount++;
    if (event.isZeroResult === true) existing.zeroResultCount++;
    exact.set(term, existing);
  }

  // Typo-tolerance merge: collapse near-duplicate terms (edit distance 1) into
  // whichever bucket has more searches, so a stray typo doesn't fragment the rollup.
  const keys = Array.from(exact.keys());
  const dropped = new Set<string>();

  for (let i = 0; i < keys.length; i++) {
    const a = keys[i];
    if (dropped.has(a)) continue;

    for (let j = i + 1; j < keys.length; j++) {
      if (dropped.has(a)) break;

      const b = keys[j];
      if (dropped.has(b)) continue;

      if (levenshteinDistance(a, b) !== 1) continue;

      const countsA = exact.get(a);
      const countsB = exact.get(b);
      if (!countsA || !countsB) continue;

      const aWins =
        countsA.searchCount > countsB.searchCount ||
        (countsA.searchCount === countsB.searchCount && a < b);

      const [keepKey, keepCounts, mergeKey, mergeCounts] = aWins
        ? [a, countsA, b, countsB]
        : [b, countsB, a, countsA];

      exact.set(keepKey, {
        searchCount: keepCounts.searchCount + mergeCounts.searchCount,
        zeroResultCount: keepCounts.zeroResultCount + mergeCounts.zeroResultCount,
      });
      exact.delete(mergeKey);
      dropped.add(mergeKey);
    }
  }

  console.log("aggregate-search-terms", { termCount: exact.size, mergedCount: dropped.size });
  return exact;
}

export function aggregateJobEngagement(
  events: AnalyticsEventModel[]
): Map<string, JobEngagementCounts> {
  const byJob = new Map<string, JobEngagementCounts>();

  for (const event of events) {
    if (event.jobId === null) continue;
    if (event.eventType !== "job_view" && event.eventType !== "apply_click") continue;

    const existing = byJob.get(event.jobId) ?? { jobViewCount: 0, applyClickCount: 0 };
    if (event.eventType === "job_view") existing.jobViewCount++;
    else existing.applyClickCount++;
    byJob.set(event.jobId, existing);
  }

  console.log("aggregate-job-engagement", { jobCount: byJob.size });
  return byJob;
}
