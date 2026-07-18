import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**"],
      exclude: ["**/*.test.ts", "**/*.config.*", "dist/**"],
      // Floor set just below current coverage to guard against regression.
      thresholds: { statements: 40, branches: 55, functions: 38, lines: 40 },
    },
  },
});
