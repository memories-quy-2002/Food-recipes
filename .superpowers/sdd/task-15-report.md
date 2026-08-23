# Task 15 Report: Containerize API and PostgreSQL

## Implemented

- Added a multi-stage Node 24 Dockerfile for `src/backend/apps/api`.
  - Installs the workspace dependencies with the root `pnpm-lock.yaml` and pinned pnpm 11.18.0.
  - Generates Prisma Client and builds the Nest API.
  - Provides `runtime`, `migration`, and development targets; the default runtime executes `dist/main.js` as `node`.
- Added API and root Docker ignore files. The API ignore rules deliberately retain Prisma schema and migration paths.
- Added production-like Compose services for PostgreSQL, an explicit one-shot `prisma migrate deploy` service, and an internal API service that always listens on container port `3000`.
- Added a standalone development Compose stack with localhost-only API/PostgreSQL ports and API source/config mounts. `API_PORT` now controls only the host-side API port; the container remains on `3000`.
- Added `src/backend/apps/api/test/docker-infrastructure.validation.mjs`, a Docker-daemon-free static invariant check covering the fixed internal/host port contract.

## Verification

- `node src/backend/apps/api/test/docker-infrastructure.validation.mjs` — passed.
- `docker compose -f infrastructure/docker/docker-compose.yml config` — passed.
- `docker compose -f infrastructure/docker/docker-compose.dev.yml config` — passed.
- `API_PORT=4310 docker compose -f infrastructure/docker/docker-compose.dev.yml config` — passed; the host port resolves to `4310` while the API container port remains `3000`.
- `corepack pnpm --filter @food-recipes/api run build` — passed.
- `corepack pnpm --filter @food-recipes/api exec tsc -p tsconfig.json --noEmit` — passed.
- `git diff --check` — passed.

## Limitations

- Docker CLI is installed, but the Docker Desktop Linux daemon is unavailable (`//./pipe/dockerDesktopLinuxEngine`), so `docker build` and a live Compose smoke test could not run.
- `src/backend/apps/api/prisma/migrations` does not currently exist. No migration or reset was created. The Compose migration service intentionally remains an explicit `prisma migrate deploy` gate; a reviewed baseline/initial migration must be added before a database-backed stack can complete that gate against the legacy schema.
- No secrets were added. Compose defaults are local placeholders and should be overridden through environment variables for shared or deployed environments.
