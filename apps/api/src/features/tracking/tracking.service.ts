import { createHash } from "node:crypto";
import { analyticsEventRepo } from "@repo/db";
import type { NewAnalyticsEventModel } from "@repo/db";
import type { TrackEventRequest } from "./tracking.schema.js";

const BOT_UA_SUBSTRINGS = [
  "googlebot",
  "bingbot",
  "ahrefsbot",
  "semrushbot",
  "curl/",
  "python-requests",
];

const APPLY_CLICK_DEDUP_WINDOW_MS = 5000;

function isBotUserAgent(userAgent: string | undefined): boolean {
  if (!userAgent || userAgent.trim().length === 0) {
    return true;
  }
  const lowered = userAgent.toLowerCase();
  return BOT_UA_SUBSTRINGS.some((substring) => lowered.includes(substring));
}

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

export const trackingService = {
  ingest: async (
    event: TrackEventRequest,
    meta: { ip: string; userAgent: string | undefined }
  ): Promise<void> => {
    console.log(
      "tracking-service.ingest",
      JSON.stringify({ eventType: event.eventType, visitorId: event.visitorId })
    );

    if (event.eventType === "apply_click") {
      const recent = await analyticsEventRepo.findRecentApplyClick(
        event.jobId,
        event.visitorId,
        APPLY_CLICK_DEDUP_WINDOW_MS
      );
      if (recent) {
        return;
      }
    }

    const metadata: Record<string, unknown> = {};
    if (isBotUserAgent(meta.userAgent)) {
      metadata.isBot = true;
    }
    if (event.eventType === "visit") {
      metadata.referrer = event.referrer ?? null;
    }

    const data: NewAnalyticsEventModel = {
      eventType: event.eventType,
      visitorId: event.visitorId,
      sessionId: event.sessionId,
      path: event.eventType === "visit" ? event.path : undefined,
      jobId:
        event.eventType === "job_view" || event.eventType === "apply_click"
          ? event.jobId
          : undefined,
      searchQuery: event.eventType === "search" ? event.searchQuery : undefined,
      searchFilters: event.eventType === "search" ? (event.searchFilters ?? undefined) : undefined,
      isZeroResult: event.eventType === "search" ? event.isZeroResult : undefined,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      ipHash: hashIp(meta.ip),
    };

    await analyticsEventRepo.create(data);
  },
};
