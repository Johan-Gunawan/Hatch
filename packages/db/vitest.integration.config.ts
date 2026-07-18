import { defineConfig } from "vitest/config";

// Separate lane for DB-backed tests: they need Docker (Testcontainers) and are
// slower, so they run via `pnpm --filter @repo/db test:integration`, never as
// part of the default `pnpm test`. A single fork keeps all tests on one DB
// connection lifecycle and avoids cross-test races on the shared container.
export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.integration.test.ts"],
    globalSetup: ["./test/global-setup.ts"],
    setupFiles: ["./test/setup-env.ts"],
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
});
