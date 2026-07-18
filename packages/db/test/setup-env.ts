import { inject } from "vitest";

// Runs in each worker BEFORE any test module is imported, so setting
// DATABASE_URL here means @repo/db's db.ts (which reads it at import time)
// connects to the throwaway container started in global-setup.ts.
process.env.DATABASE_URL = inject("databaseUrl");
