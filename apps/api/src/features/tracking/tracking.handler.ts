import { getConnInfo } from "@hono/node-server/conninfo";
import type { Context } from "hono";
import { respond } from "../../utils/responses.js";
import { TrackEventRequestSchema } from "./tracking.schema.js";
import { trackingService } from "./tracking.service.js";

export const trackHandler = async (c: Context) => {
  const body = await c.req.json();
  const parsed = TrackEventRequestSchema.safeParse(body);

  if (!parsed.success) {
    return respond.badRequest(c, "Invalid event payload");
  }

  const ip = getConnInfo(c).remote.address ?? c.req.header("x-forwarded-for") ?? "unknown";
  const userAgent = c.req.header("user-agent");

  await trackingService.ingest(parsed.data, { ip, userAgent });

  return respond.accepted(c, { ok: true });
};
