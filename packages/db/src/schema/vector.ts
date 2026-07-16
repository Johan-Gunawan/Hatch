import { customType } from "drizzle-orm/pg-core";

// Dimension of the stored embeddings. MUST equal the embedding model's output
// size (OpenAI text-embedding-3-small → 1536, see @repo/ai EMBEDDING_DIM).
// Changing the model ⇒ new column + full re-embed.
export const EMBEDDING_DIM = 1536;

// pgvector column type for Drizzle. Postgres stores/returns the vector as a
// bracketed string literal (e.g. "[0.12,0.34,...]"); we marshal to/from a
// plain number[] at the driver boundary so repositories work with arrays.
export const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return `vector(${EMBEDDING_DIM})`;
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: string): number[] {
    return value.slice(1, -1).split(",").map(Number);
  },
});
