// Fire-and-forget analytics client. Unlike apiFetch, these never throw and are
// never awaited by call sites — tracking must never block or break the page.
// visitorId/sessionId are stamped server-side by app/api/track/route.ts; this
// layer never reads cookies or sends identity fields itself.
function send(body: Record<string, unknown>): void {
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {});
}

export function trackVisit(path: string): void {
  send({ eventType: "visit", path });
}

export function trackSearch(params: {
  query: string;
  filters: Record<string, unknown>;
  isZeroResult: boolean;
}): void {
  send({
    eventType: "search",
    searchQuery: params.query,
    searchFilters: params.filters,
    isZeroResult: params.isZeroResult,
  });
}

export function trackJobView(jobId: string): void {
  send({ eventType: "job_view", jobId });
}

export function trackApplyClick(jobId: string): void {
  send({ eventType: "apply_click", jobId });
}
