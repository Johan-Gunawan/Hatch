import OpenAI from "openai";

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIM = 1536;

// text-embedding-3-small accepts ~8191 tokens per input; ~30k chars is a safe
// margin below that so long job/resume text is truncated rather than rejected.
const MAX_CHARS = 30_000;
// Keep each request well under the model's per-call input-array / token limits.
const BATCH_SIZE = 100;

// Lazily construct the OpenAI client so importing @repo/ai never throws when
// OPENAI_API_KEY is unset (e.g. a worker run that only uses DeepSeek). It only
// errors if embeddings are actually requested without a key.
let client: OpenAI | null = null;
function openai(): OpenAI {
  // Prefer the SDK-standard OPENAI_API_KEY; fall back to OPEN_AI_KEY, which this
  // repo's .env already uses.
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? process.env.OPEN_AI_KEY });
  }
  return client;
}

const prepare = (text: string): string => text.replace(/\s+/g, " ").trim().slice(0, MAX_CHARS);

export async function embedText(text: string): Promise<number[]> {
  const [vector] = await embedBatch([text]);
  return vector;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  console.log("ai.embedBatch", JSON.stringify({ count: texts.length }));
  const inputs = texts.map(prepare);
  console.log("INPUTS", inputs);
  const vectors: number[][] = [];
  for (let i = 0; i < inputs.length; i += BATCH_SIZE) {
    const slice = inputs.slice(i, i + BATCH_SIZE);
    console.log("SLICE", slice);
    const res = await openai().embeddings.create({ model: EMBEDDING_MODEL, input: slice });
    for (const item of res.data) vectors.push(item.embedding);
  }
  return vectors;
}
