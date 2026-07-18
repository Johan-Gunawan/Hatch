import { db } from "./db.js";
import { jobSources, jobs, sql } from "./index.js";

// Deterministic seed for the Playwright E2E suite: a clean set of active jobs
// with recognizable "E2E …" titles the specs assert against. Run against the
// e2e/test database (DATABASE_URL) before the browser suite. Idempotent — it
// truncates the job graph first.
async function main() {
  console.log("seed-e2e", JSON.stringify({ step: "truncate" }));
  await db.execute(sql`TRUNCATE TABLE jobs, scrape_runs, job_sources RESTART IDENTITY CASCADE`);

  const [source] = await db
    .insert(jobSources)
    .values({ name: "E2E Source", careerPageUrl: "https://e2e.example.com/careers" })
    .returning();

  const rows = [
    {
      title: "E2E Senior Backend Engineer",
      companyName: "Acme Corp",
      locationRaw: "Jakarta",
      sourceUrl: "https://e2e.example.com/jobs/backend",
      description: "Build and scale backend services.",
      requirements: "5+ years Go or Node.js.",
    },
    {
      title: "E2E Frontend Developer",
      companyName: "Globex",
      locationRaw: "Bandung",
      sourceUrl: "https://e2e.example.com/jobs/frontend",
      description: "Own the web UI.",
      requirements: "React and TypeScript.",
    },
    {
      title: "E2E Data Scientist",
      companyName: "Initech",
      locationRaw: "Remote",
      sourceUrl: "https://e2e.example.com/jobs/data",
      description: "Model things.",
      requirements: "Python and statistics.",
    },
  ];

  await db.insert(jobs).values(rows.map((r) => ({ ...r, jobSourceId: source.id, isActive: true })));

  console.log("seed-e2e", JSON.stringify({ step: "done", jobs: rows.length }));
  process.exit(0);
}

main().catch((err) => {
  console.error("seed-e2e failed", err);
  process.exit(1);
});
