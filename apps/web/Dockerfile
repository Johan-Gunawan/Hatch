# Build context is the repo root (this is a pnpm workspace monorepo) — see docker-compose.yml.
FROM node:24-bookworm-slim

RUN corepack enable && corepack prepare pnpm@11.6.0 --activate

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["pnpm", "dev"]
