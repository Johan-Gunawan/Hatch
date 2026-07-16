// Browser-safe analytics client. Only exposes the rollup trigger — dashboard
// reads go through analytics.read.ts (server-only, uses serverFetch).
export function triggerRollup(): void {
  fetch("/api/analytics/rollup", { method: "POST" }).catch(() => {});
}
