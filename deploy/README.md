# Deploying the backend to Cloud Run (free tier)

Deploys `apps/api` and `apps/worker` to Google Cloud Run in `asia-southeast1`
(Singapore), backed by a Neon Postgres database and Inngest Cloud as the event
bus. Both services scale to zero when idle, so this runs at $0/month within
Cloud Run's Always Free tier (360,000 GiB-seconds memory, 180,000 vCPU-seconds,
2M requests per month) for a light-to-moderate scraping cadence. `apps/web` is
out of scope here — deploy it separately (e.g. Vercel).

## One-time setup

### 1. GCP project

- Create (or pick) a GCP project and enable billing on it. Billing must be
  active even to use the Always Free quota — you won't be charged as long as
  usage stays under the limits above.
- Install the `gcloud` CLI and run `gcloud auth login` + `gcloud config set project <PROJECT_ID>`.
- Enable the required APIs:
  ```
  gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
    artifactregistry.googleapis.com secretmanager.googleapis.com
  ```

### 2. Artifact Registry

Create the Docker repo the build pushes images to (one-time):

```
gcloud artifacts repositories create scrapper-ats \
  --repository-format=docker --location=asia-southeast1
```

### 3. Neon database

- Create a Neon project in the **Singapore (`ap-southeast-1`)** region — same
  region as the Cloud Run services, to keep api/worker ↔ database latency low.
- In the Neon SQL editor, enable the extension this schema depends on:
  `CREATE EXTENSION IF NOT EXISTS vector;`
- Copy the pooled connection string — this is your `DATABASE_URL`.

### 4. Inngest Cloud

- Create an app at [inngest.com](https://www.inngest.com) (free tier: 50,000
  runs/month).
- Generate an **Event Key** (`INNGEST_EVENT_KEY`) and a **Signing Key**
  (`INNGEST_SIGNING_KEY`) — don't register the worker URL yet, it doesn't
  exist until after the first deploy (see step below).

### 5. Secret Manager

Create one secret per required env var (values from steps 3–4 above, plus
your existing DeepSeek/API-key/admin credentials):

```
for name in DATABASE_URL DEEPSEEK_AI API_KEYS ADMIN_API_KEYS ADMIN_PASSWORD \
            CORS_ORIGINS INNGEST_EVENT_KEY INNGEST_SIGNING_KEY; do
  printf '%s' "<value>" | gcloud secrets create "$name" --data-file=-
done
```

`CORS_ORIGINS` should be the deployed frontend's origin (comma-separated if
more than one); until the web app is deployed, `http://localhost:3000` is a
safe placeholder. Re-run `gcloud secrets versions add <name> --data-file=-`
to rotate any value later — `deploy.sh`/`cloudbuild.yaml` always deploy the
secret's `:latest` version.

## Deploying

From the repo root:

```
pnpm db:migrate    # only needed once, or after a schema change — deploy.sh
                    # also runs this automatically unless RUN_MIGRATIONS=0
./deploy/deploy.sh
```

This builds both images, pushes them to Artifact Registry, and deploys both
Cloud Run services. `deploy.sh` checks all eight secrets exist before
building anything and fails fast with the missing names if not.

### Register the worker URL with Inngest

After the **first** deploy, `gcloud run services describe scrapper-ats-worker
--region=asia-southeast1 --format='value(status.url)'` prints the worker's
public URL. In the Inngest Cloud dashboard, register
`<that-url>/api/inngest` as the app's sync URL so Inngest knows where to send
invocations. Re-deploys reuse the same URL, so this is also one-time.

## Smoke test

```
curl https://<api-service-url>/health
# {"status":"ok"}

curl -X POST https://<api-service-url>/api/jobs/scrape \
  -H "x-api-key: <one of your API_KEYS>" \
  -H "Content-Type: application/json" \
  -d '{"jobSourceId": "<a real job_sources.id>"}'
# 202
```

Then check the Inngest Cloud dashboard for the `job/scrape.requested` event
and its run, the Cloud Run worker service's logs (`gcloud run services logs
read scrapper-ats-worker --region=asia-southeast1`), and confirm a row
appears/updates in `scrape_runs` via `pnpm db:studio` pointed at the Neon
`DATABASE_URL`.

## Logs / rollback

- Logs: `gcloud run services logs read <service> --region=asia-southeast1`
  or the Cloud Run console's Logs tab.
- Rollback: Cloud Run keeps every revision. List them with `gcloud run
  revisions list --service=<service> --region=asia-southeast1` and shift
  traffic back with `gcloud run services update-traffic <service>
  --region=asia-southeast1 --to-revisions=<revision>=100`.
