import { execSync } from "node:child_process";

// Seed the test database with deterministic jobs before the browser suite runs.
// The seed script lives in @repo/db so it resolves the schema locally; it reads
// DATABASE_URL from the environment (assumed already migrated in CI).
export default function globalSetup() {
  console.log("e2e global-setup: seeding test database");
  execSync("pnpm --filter @repo/db db:seed:e2e", { stdio: "inherit" });
}
