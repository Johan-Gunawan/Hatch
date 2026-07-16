import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources";
import { sanitizeLlmJson } from "./sanitize.js";

export const DEEPSEEK_MODEL = "deepseek-v4-flash";

// Lazily construct the DeepSeek client (OpenAI SDK pointed at api.deepseek.com)
// so importing @repo/ai never throws when DEEPSEEK_AI is unset — it only errors
// if a DeepSeek call is actually made without a key.
let client: OpenAI | null = null;
function deepseek(): OpenAI {
  if (!client) {
    client = new OpenAI({
      baseURL: "https://api.deepseek.com",
      apiKey: process.env.DEEPSEEK_AI,
    });
  }
  return client;
}

export interface DeepseekJsonCallOptions {
  model: string;
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
}

export async function callDeepseekJson(options: DeepseekJsonCallOptions): Promise<unknown> {
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: options.system },
    { role: "user", content: options.user },
  ];

  const response = await deepseek().chat.completions.create({
    model: options.model,
    response_format: { type: "json_object" },
    messages,
    temperature: options.temperature ?? 0.1,
    ...(options.maxTokens ? { max_tokens: options.maxTokens } : {}),
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty response from model");

  return JSON.parse(sanitizeLlmJson(raw));
}
