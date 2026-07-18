// Asia/Jakarta (WIB) is UTC+7 year-round — no DST — so a fixed offset is safe.
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;

// `scrape_runs.completed_at`/`created_at` are `timestamp` (no time zone)
// columns. Drizzle serializes JS Date values written to them (via .values()/
// .set()) as raw UTC digits, independent of the connection's `Asia/Jakarta`
// session timezone (see ../db.ts) — so comparing them against SQL-side
// `now()`/`date_trunc('day', now())`, which DOES honor that session timezone,
// is silently off by exactly 7 hours for roughly 7 hours of every day. These
// helpers compute "the start of the current Asia/Jakarta calendar day" so
// comparisons stay self-consistent with how those columns are actually stored.
export function startOfTodayJakarta(): Date {
  const jakartaNow = Date.now() + JAKARTA_OFFSET_MS;
  const jakartaMidnight = Math.floor(jakartaNow / 86_400_000) * 86_400_000;
  return new Date(jakartaMidnight - JAKARTA_OFFSET_MS);
}

// For hand-written `sql` templates, where interpolating a plain Date throws
// (the raw driver needs a string/Buffer without column-type context to know
// how to bind it) — the literal naive digits, cast explicitly so Postgres
// parses them with no timezone interpretation, matching how the naive column
// itself is stored.
export function startOfTodayJakartaLiteral(): string {
  return startOfTodayJakarta().toISOString().replace("T", " ").replace("Z", "");
}
