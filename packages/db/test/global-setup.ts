import path from "node:path";
import { fileURLToPath } from "node:url";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import type { GlobalSetupContext } from "vitest/node";

// Starts one throwaway Postgres (pgvector image — migration 0003 does
// `CREATE EXTENSION vector` and adds vector columns, which the stock postgres
// image can't do) for the whole integration run, applies the real Drizzle
// migrations from ../drizzle, and hands the connection URI to the worker via
// vitest's provide/inject. test/setup-env.ts reads it into process.env before
// any test imports @repo/db (whose db.ts binds the connection at import time).

const dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(dirname, "../drizzle");

declare module "vitest" {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}

export default async function setup({ provide }: GlobalSetupContext) {
  const container = await new PostgreSqlContainer("pgvector/pgvector:pg16").start();
  const uri = container.getConnectionUri();

  const migrationClient = postgres(uri, { max: 1 });
  try {
    await migrate(drizzle(migrationClient), { migrationsFolder });
  } finally {
    await migrationClient.end();
  }

  provide("databaseUrl", uri);

  return async () => {
    await container.stop();
  };
}
