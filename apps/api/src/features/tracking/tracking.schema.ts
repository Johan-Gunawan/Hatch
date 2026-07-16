import { z } from "zod";

const baseEventSchema = z.object({
  visitorId: z.string().min(1),
  sessionId: z.string().min(1),
});

const visitEventSchema = baseEventSchema.extend({
  eventType: z.literal("visit"),
  path: z.string(),
  referrer: z.string().nullable().optional(),
});

const searchEventSchema = baseEventSchema.extend({
  eventType: z.literal("search"),
  searchQuery: z.string().min(1),
  searchFilters: z.record(z.string(), z.unknown()).nullable().optional(),
  isZeroResult: z.boolean(),
});

const jobViewEventSchema = baseEventSchema.extend({
  eventType: z.literal("job_view"),
  jobId: z.string().uuid(),
});

const applyClickEventSchema = baseEventSchema.extend({
  eventType: z.literal("apply_click"),
  jobId: z.string().uuid(),
});

export const TrackEventRequestSchema = z.discriminatedUnion("eventType", [
  visitEventSchema,
  searchEventSchema,
  jobViewEventSchema,
  applyClickEventSchema,
]);

export type TrackEventRequest = z.infer<typeof TrackEventRequestSchema>;
