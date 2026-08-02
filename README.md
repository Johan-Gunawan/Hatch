# Scrapper ATS Web

An automated job-scraping platform that crawls company career pages, extracts structured job
postings with an LLM, and serves them through a searchable jobs board.

Instead of relying on a single fixed scraper per site, this project uses **DeepSeek** (an LLM) to
read raw HTML and pull out structured data — job titles, descriptions, salaries, locations,
requirements, etc. — so it can adapt to career pages with different layouts without a custom
parser for each one. Pagination strategy and JS-render requirements are also *learned* per source
on first run and cached for subsequent scrapes.

## What it does

1. **Company scraping** — given a company homepage URL, the worker finds the careers page, extracts
   company info (name, industry, location, logo, etc.), detects whether the careers page is a known
   branded ATS (Greenhouse, Lever, Workday, ...) vs. a custom-built page, and saves it as a job
   source.
2. **Job scraping** — for each active (custom-built) job source, the worker crawls the paginated
   listing page, extracts job stubs, visits each job's detail page, and extracts the full job
   posting via the LLM. Results are upserted into the database, deduplicated by URL, and stale
   listings are deactivated automatically.
3. **Jobs board** — a Next.js web app exposes the scraped jobs with real backend search, filtering
   (category, work arrangement, location, company, salary) and infinite-scroll pagination.
4. **Resume matching** — a candidate pastes their resume text and gets back a ranked shortlist of
   scraped jobs, using a hybrid semantic-search + LLM-rerank pipeline:
   - **Parse** — DeepSeek turns the raw resume text into a structured profile (skills, job titles,
     seniority, years of experience, location preference, summary).
   - **Embed** — the profile is embedded with an OpenAI embedding model
     (`text-embedding-3-small`). Job postings are embedded the same way as they're scraped (plus a
     one-off `embed:backfill` script for jobs that predate this feature), so both sides live in the
     same vector space.
   - **Vector search** — `pgvector` cosine-similarity search (`packages/db`'s
     `JobRepository.searchByEmbedding`) finds the closest candidate jobs in Postgres, with cheap SQL
     pre-filters (location, minimum salary) that are automatically relaxed if they exclude every
     result.
   - **Rerank** — DeepSeek re-orders the shortlist against the full candidate profile for the final,
     authoritative ranking (fails open to the vector-search order if the rerank call errors).
   - **Explain** — a follow-up endpoint does on-demand RAG: given a saved resume and a specific job,
     DeepSeek explains *why* they match (strengths/gaps), grounded in the stored profile and job
     text.

## Architecture

This is a **pnpm workspace monorepo** orchestrated with **Turborepo**.

```text
apps/
  web/      Next.js 16 + React 19 + Tailwind v4 + shadcn/ui        → jobs board & admin dashboard (:3000)
  api/      Hono REST API (OpenAPIHono + @hono/node-server)        → read endpoints + scrape triggers (:3001)
  worker/   Inngest background job server                         → Playwright + LLM scraping (:3002)
packages/
  db/       Drizzle ORM shared database layer (postgres.js + PostgreSQL, incl. pgvector)
  ai/       Shared LLM helpers — DeepSeek JSON calls + OpenAI embeddings
```

### Data flow

```text
POST /api/companies/scrape { urls: [...] }
  └─ inngest.send("company/scrape.requested", { url }) per URL
       └─ worker: scrape homepage → extract company data (DeepSeek)
                → resolve province/district/industry → upsert company
                → detect careers page + branded ATS → upsert job_source

POST /api/jobs/scrape?jobSourceId=<id>   (or omit to fan out to all active sources)
  └─ inngest.send("job/scrape.requested", { jobSourceId })
       └─ worker: crawl paginated listing (DeepSeek) → per job: scrape detail page,
                extract full posting (DeepSeek) → upsert job → deactivate stale listings

browser → /jobs board (Next.js SSR + client hooks)
  └─ same-origin route handlers → apps/api (x-api-key) → Postgres (filter/sort/paginate)

POST /api/resumes/match { resumeText, locations?, minSalary? }
  └─ apps/api: parse resume (DeepSeek) → embed profile (OpenAI) → pgvector search over jobs
            → rerank shortlist (DeepSeek) → persist resume + matches → return ranked jobs

POST /api/resumes/match/{jobId}/explain { resumeId }
  └─ apps/api: load saved resume profile + job → DeepSeek explains the match (RAG)
```

- LLM extraction/parsing/rerank/explain all run against **DeepSeek** (`deepseek-v4-flash`) via the
  raw `openai` SDK pointed at `https://api.deepseek.com`. Resume/job **embeddings** are the one
  exception — those go through OpenAI's `text-embedding-3-small`, since DeepSeek doesn't offer an
  embeddings endpoint.
- Playwright is used as a fallback for pages that need JS rendering (detected automatically).
- The API never scrapes directly — it only enqueues Inngest events; all scraping happens in the
  worker. Resume matching, by contrast, runs synchronously inside the API (no Inngest event) since
  it's a request/response flow, not a background crawl.

## Prerequisites

- **Node.js** 20+
- **pnpm** 11.6.0 (see `packageManager` in `package.json` — `corepack` will pick this up
  automatically)
- A **DeepSeek API key** — <https://platform.deepseek.com>
- An **OpenAI API key** — <https://platform.openai.com> (only needed for resume matching; it's used
  purely for embeddings, not chat completions)
- PostgreSQL must support the **`pgvector`** extension (needed for resume matching's semantic
  search). The default `postgres:16-alpine` image in `docker-compose.yml` does **not** include it —
  swap it for `pgvector/pgvector:pg16` (or install the extension yourself) if you want resume
  matching to work.

## Getting started

### 1. Clone and install dependencies

```bash
git clone <your-fork-or-repo-url>
cd scrapper-ats-web
corepack enable          # ensures the pinned pnpm version is used
pnpm install
```

### 2. Configure environment variables

Copy the example env file and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `DEEPSEEK_AI` | DeepSeek API key, used for all LLM extraction/parsing/rerank/explain |
| `OPENAI_API_KEY` (or `OPEN_AI_KEY`) | OpenAI API key, used only for resume/job embeddings (resume matching) |
| `INNGEST_EVENT_KEY` | Inngest event key (any string works for local dev) |
| `API_KEYS` | Comma-separated API keys accepted by the API's `x-api-key` guard |
| `ADMIN_API_KEYS` | Comma-separated admin keys, exempt from rate limiting (used by the admin dashboard) |
| `CORS_ORIGINS` | Comma-separated allowed origins (default `http://localhost:3000`) |
| `RATE_LIMIT_WINDOW_MS` | Rate-limit window in ms (default `900000`) |
| `RATE_LIMIT_MAX` | Max requests per window per IP (default `100`) |

If you plan to run everything via Docker Compose instead, also create a `.env.docker` file with the
same variables plus your Postgres credentials (`POSTGRES_USER`, `POSTGRES_PASSWORD`,
`POSTGRES_DB`), matching what `docker-compose.yml` expects.

### 3. Start PostgreSQL

Easiest via Docker:

```bash
docker compose up -d postgres
```

Or point `DATABASE_URL` at any PostgreSQL 16+ instance you already have running.

### 4. Run database migrations

```bash
pnpm db:migrate
```

Optional: seed lookup data (provinces, districts, industries, etc.):

```bash
pnpm --filter @repo/db db:seed
```

If you have existing jobs from before resume matching was added (or just want to double-check
everything's embedded), backfill their embeddings:

```bash
pnpm --filter @repo/worker embed:backfill
```

This is idempotent and resumable — it only embeds jobs where `embedding IS NULL`, so it's safe to
re-run.

### 5. Install Playwright's browser (worker only, first time)

```bash
pnpm --filter @repo/worker playwright:install
```

### 6. Run the apps

Start everything in parallel (web, api, worker):

```bash
pnpm dev
```

- Web (jobs board): <http://localhost:3000>
- API (Swagger docs): <http://localhost:3001/docs>
- Worker (Inngest dev server functions): <http://localhost:3002>

You'll also need a local **Inngest dev server** to trigger and observe background jobs:

```bash
npx inngest-cli@latest -u http://localhost:3002
```

Or run individual apps:

```bash
pnpm --filter @repo/web dev
pnpm --filter @repo/api dev
pnpm --filter @repo/worker dev
```

### 7. Trigger a scrape

Enqueue a company scrape:

```bash
curl -X POST http://localhost:3001/api/companies/scrape \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-secret-key" \
  -d '{"urls": ["https://example-company.com"]}'
```

Enqueue a job scrape for all active sources not yet scraped today:

```bash
curl -X POST http://localhost:3001/api/jobs/scrape \
  -H "x-api-key: dev-secret-key"
```

Watch progress in the Inngest dev server UI at <http://localhost:8288>, then browse the results at
<http://localhost:3000/jobs>.

### 8. Try resume matching

Once you have some scraped (and embedded) jobs, match a resume against them:

```bash
curl -X POST http://localhost:3001/api/resumes/match \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-secret-key" \
  -d '{"resumeText": "<paste resume text here, 50+ characters>"}'
```

The response includes a `resumeId` and ranked `items`. Ask why a specific job matched:

```bash
curl -X POST http://localhost:3001/api/resumes/match/<jobId>/explain \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-secret-key" \
  -d '{"resumeId": "<resumeId from the previous response>"}'
```

## Other commands

```bash
pnpm build        # build all packages and apps
pnpm lint         # biome check across the monorepo
pnpm format       # biome format --write (auto-fix formatting)
pnpm typecheck    # tsc --noEmit across all packages
pnpm db:studio    # open Drizzle Studio (DB browser UI)

# Worker unit tests (vitest)
pnpm --filter @repo/worker test
```

## Tech stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS v4, shadcn/ui (Base UI)
- **API**: Hono + OpenAPIHono, Zod validation, Swagger UI
- **Worker**: Inngest (background jobs/orchestration), Playwright (headless browsing), Cheerio (HTML parsing)
- **LLM**: DeepSeek (`deepseek-v4-flash`) via the OpenAI-compatible SDK for extraction/parsing/rerank/explain, OpenAI `text-embedding-3-small` for embeddings
- **Database**: PostgreSQL + Drizzle ORM + `pgvector` (semantic search for resume matching)
- **Tooling**: pnpm workspaces, Turborepo, Biome (lint/format), TypeScript
