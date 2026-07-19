#!/usr/bin/env bash
set -euo pipefail

# Deploys apps/api and apps/worker to Cloud Run (asia-southeast1) via
# deploy/cloudbuild.yaml. Run from the repo root: ./deploy/deploy.sh
#
# One-time prerequisites (see deploy/README.md): GCP project with billing
# enabled and gcloud authenticated, Artifact Registry repo "scrapper-ats"
# created in asia-southeast1, and the Secret Manager secrets listed below.
#
# Set RUN_MIGRATIONS=0 to skip the `pnpm db:migrate` step (e.g. re-deploying
# with no schema change).

cd "$(dirname "$0")/.."

REQUIRED_SECRETS=(
  DATABASE_URL
  DEEPSEEK_AI
  API_KEYS
  ADMIN_API_KEYS
  ADMIN_PASSWORD
  CORS_ORIGINS
  INNGEST_EVENT_KEY
  INNGEST_SIGNING_KEY
)

echo "deploy-check-secrets, [$(printf '"%s",' "${REQUIRED_SECRETS[@]}")]"

missing=0
for secret in "${REQUIRED_SECRETS[@]}"; do
  if ! gcloud secrets describe "$secret" >/dev/null 2>&1; then
    echo "deploy-missing-secret, {\"secret\": \"$secret\"}"
    missing=1
  fi
done

if [ "$missing" -eq 1 ]; then
  echo "One or more Secret Manager secrets are missing — create them first, see deploy/README.md." >&2
  exit 1
fi

if [ "${RUN_MIGRATIONS:-1}" = "1" ]; then
  echo "deploy-run-migrations"
  pnpm db:migrate
fi

echo "deploy-submit-build"
gcloud builds submit --config deploy/cloudbuild.yaml .
