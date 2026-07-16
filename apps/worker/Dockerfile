# Build context is the repo root (this is a pnpm workspace monorepo) — see docker-compose.yml.
# Microsoft's Playwright image ships Chromium/Firefox/WebKit + all the system deps headless
# browsers need (fonts, libnss, etc.) — installing those by hand on a plain node image is
# error-prone, so we build on top of it instead. Keep the tag in sync with the "playwright"
# version pinned in apps/worker/package.json.
FROM mcr.microsoft.com/playwright:v1.52.0-jammy

RUN corepack enable && corepack prepare pnpm@11.6.0 --activate

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile

WORKDIR /app/apps/worker

EXPOSE 3002

CMD ["pnpm", "exec", "tsx", "watch", "src/index.ts"]
