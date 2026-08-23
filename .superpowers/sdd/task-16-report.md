# Task 16 Report: Add Kong DB-less Gateway

## Implemented

- Added `infrastructure/kong/kong.yml` in declarative format 3.0.
  - Routes `/api`, `/docs`, and `/docs-json` to `http://api:3000`.
  - Preserves `/api/v1/...` paths with `strip_path: false`.
  - Echoes `X-Request-ID` with the `correlation-id` plugin.
  - Applies a 60 requests/minute/client-IP local rate limit with an explicit HTTP 429 policy.
  - Leaves authentication and authorization in NestJS; no Kong auth plugin or stateful dependency was added.
- Added Kong to the production-like Compose stack in DB-less mode with a read-only config mount and public port `8000`.
- Kept the API internal in production-like Compose and added an API healthcheck so Kong waits for `service_healthy` after migrations complete.
- Kept `docker-compose.dev.yml` unchanged and independent from Kong.
- Extended `src/backend/apps/api/test/docker-infrastructure.validation.mjs` to inspect Kong YAML and Compose gateway wiring without requiring Kong or Docker for static validation.

## Verification

- `node src/backend/apps/api/test/docker-infrastructure.validation.mjs` — passed.
- `docker compose -f infrastructure/docker/docker-compose.yml config` — passed.
- `docker compose -f infrastructure/docker/docker-compose.dev.yml config` — passed.
- `corepack pnpm --filter @food-recipes/api run build` — passed.
- `git diff --check` — passed.

## Limitations

- A live Kong/API smoke test was not run because Docker Desktop's Linux daemon is unavailable (`//./pipe/dockerDesktopLinuxEngine`).
- The local rate-limit policy keeps counters in Kong memory per process; it intentionally does not provide shared limits across multiple gateway replicas.
