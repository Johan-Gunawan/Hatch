// The DeepSeek JSON-call helper now lives in the shared @repo/ai package so the
// API can reuse it. Re-exported here to keep existing worker import paths
// (`../../lib/llm-json.js`) stable.
export { callDeepseekJson, type DeepseekJsonCallOptions } from "@repo/ai";
