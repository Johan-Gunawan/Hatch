import { defineConfig, devices } from "@playwright/test";

// End-to-end suite: builds and starts the real API + web against a test
// database (DATABASE_URL), seeds deterministic jobs (global-setup), then drives
// the /jobs board in a browser. Explicit API keys are wired so the web→API
// server-side proxy authenticates regardless of NODE_ENV.
const isCI = !!process.env.CI;
const API_KEYS = "e2e-key";
const ADMIN_API_KEYS = "e2e-admin-key";
const API_URL = "http://localhost:3001";
const WEB_URL = "http://localhost:3000";

const apiEnv = {
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  API_KEYS,
  ADMIN_API_KEYS,
};

const webEnv = {
  NEXT_PUBLIC_API_URL: API_URL,
  API_KEY: API_KEYS,
  ADMIN_API_KEY: ADMIN_API_KEYS,
};

export default defineConfig({
  testDir: "./e2e",
  testMatch: /.*\.spec\.ts/,
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: WEB_URL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "pnpm --filter @repo/api build && pnpm --filter @repo/api start",
      url: `${API_URL}/health`,
      reuseExistingServer: !isCI,
      timeout: 180_000,
      env: apiEnv,
    },
    {
      // `next dev` renders pages on demand (servers are already up by request
      // time), avoiding the build-time prerender fetches that `next build`
      // would attempt against an API that isn't listening yet.
      command: "pnpm --filter @repo/web dev",
      url: WEB_URL,
      reuseExistingServer: !isCI,
      timeout: 180_000,
      env: webEnv,
    },
  ],
});
