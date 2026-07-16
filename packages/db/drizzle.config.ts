import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { defineConfig } from "drizzle-kit";

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.env") });

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
