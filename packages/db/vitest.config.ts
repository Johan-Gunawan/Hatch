import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Integration tests run in their own Docker-backed lane (vitest.integration.config.ts).
    exclude: [...configDefaults.exclude, "**/*.integration.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**"],
      exclude: ["**/*.test.ts", "**/*.config.*", "dist/**", "src/seed.ts"],
    },
  },
});
