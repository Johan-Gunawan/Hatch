import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**"],
      exclude: ["**/*.test.ts", "**/*.config.*", "dist/**", "src/scripts/**"],
      // Floor set just below current coverage to guard against regression.
      // Raise as more of src/lib (fetch/HTML helpers) gets tested.
      thresholds: { statements: 50, branches: 70, functions: 55, lines: 50 },
    },
  },
});
