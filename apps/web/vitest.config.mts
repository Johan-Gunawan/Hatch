import path from "node:path";
import { fileURLToPath } from "node:url";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      // Next.js aliases "server-only" to a throwing shim in client bundles;
      // vitest has no such bundler-level alias, so point it at a no-op here.
      "server-only": path.resolve(dirname, "test/server-only-stub.ts"),
    },
  },
  test: {
    environment: "jsdom",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["app/**", "components/**", "hooks/**", "api/**", "lib/**"],
      exclude: ["**/*.test.ts", "**/*.test.tsx", "**/*.config.*", ".next/**"],
    },
  },
});
