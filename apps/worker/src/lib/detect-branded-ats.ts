import { ATS_DETECTION_SYSTEM, atsDetectionPrompt } from "../prompts/ats-detection.js";
import { DEEPSEEK_MODEL } from "../prompts/model.js";
import type { AtsDetection } from "../prompts/schemas/ats-detection.schema.js";
import {
  AtsDetectionSchema,
  FAILED_ATS_DETECTION,
} from "../prompts/schemas/ats-detection.schema.js";
import { callDeepseekJson } from "./llm-json.js";

const RAW_HTML_EXCERPT_LENGTH = 15_000;

export async function detectBrandedAts(
  rawHtml: string,
  cleanText: string,
  links: Array<{ text: string; url: string }>,
  url: string
): Promise<AtsDetection> {
  try {
    const hostname = new URL(url).hostname;

    const json = await callDeepseekJson({
      model: DEEPSEEK_MODEL,
      system: ATS_DETECTION_SYSTEM,
      user: atsDetectionPrompt({
        rawHtmlExcerpt: rawHtml.slice(0, RAW_HTML_EXCERPT_LENGTH),
        cleanText,
        links,
        sourceUrl: url,
        hostname,
      }),
    });

    return AtsDetectionSchema.parse(json);
  } catch (err) {
    console.log(`branded-ATS detection failed for ${url}, failing open:`, err);
    return FAILED_ATS_DETECTION;
  }
}
