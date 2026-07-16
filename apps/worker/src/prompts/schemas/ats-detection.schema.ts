import { z } from "zod";

export const AtsDetectionSchema = z.object({
  isBrandedAts: z.boolean(),
  atsPlatform: z.string().nullable(),
  reason: z.string(),
});

export type AtsDetection = z.infer<typeof AtsDetectionSchema>;

export const FAILED_ATS_DETECTION: AtsDetection = {
  isBrandedAts: false,
  atsPlatform: null,
  reason: "detection failed — failing open as custom-built",
};
