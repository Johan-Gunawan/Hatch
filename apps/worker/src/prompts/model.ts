// The DeepSeek client + model id now live in the shared @repo/ai package so the
// API can reuse the same LLM layer. Re-exported here to keep existing worker
// import paths (`../prompts/model.js`) stable.
export { DEEPSEEK_MODEL } from "@repo/ai";
