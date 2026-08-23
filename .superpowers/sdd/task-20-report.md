# Task 20: CI/CD quality gates

## Status

Implemented as a scoped workflow, DB-free workflow validator, and report. No
deployment provider was configured and the Express fallback was not changed.

## Changed files

- `.github/workflows/quality-gates.yml`
  - Runs for pull requests and pushes to `main`.
  - Pins Node 24 and pnpm 11.18.0 and uses frozen installs.
  - Gates static validation, Prisma validation/generation, API typecheck/unit
    tests, API contract E2E tests, frontend build, and Docker runtime build in
    order through `needs`.
  - Adds a dedicated one-shot migration gate/release handoff after the Docker
    gate. It runs only on pushes to `main`, reads `DATABASE_URL` only from
    `secrets.DATABASE_URL`, and does not configure an application deploy
    provider.
  - Uses a temporary non-routable Prisma config for offline validate/generate;
    those checks do not connect to a database.
- `src/backend/apps/api/test/ci-workflow.validation.mjs`
  - Verifies workflow triggers, job ordering, pins, frozen installs, static/API/
    frontend/Docker gates, secret-only database URL, one-shot migration deploy,
    release-handoff label, and absence of `migrate reset`.
- `.superpowers/sdd/task-20-report.md`

## Verification

The following checks are intended for this task and use no database, migration
deploy, push, or live Docker requirement:

- `node src/backend/apps/api/test/ci-workflow.validation.mjs`
- `node src/backend/apps/api/test/prisma-baseline.validation.mjs`
- `node src/backend/apps/api/test/recipe-duration-migration.validation.mjs`
- `node src/backend/apps/api/test/docker-infrastructure.validation.mjs`
- `pnpm --filter @food-recipes/api exec prisma validate --config prisma.ci.config.ts`
- `pnpm --filter @food-recipes/api exec prisma generate --config prisma.ci.config.ts`
- `pnpm --filter @food-recipes/api exec tsc -p tsconfig.build.json --noEmit`
- `pnpm --filter @food-recipes/api test`
- `pnpm --filter @food-recipes/api test:e2e`
- `pnpm build`
- `git diff --check`

Observed results in this working tree:

- All four static validators passed.
- Prisma validate and generate passed with the temporary offline CI config.
- API typecheck passed.
- API unit tests passed: 13 suites, 47 tests.
- API contract E2E tests passed: 2 suites, 8 tests.
- Frontend build passed with Vite.
- Docker runtime build was not run locally; the workflow definition was
  statically validated instead.

## Known limitations

- The migration gate is intentionally not run locally and requires a configured
  GitHub Actions `DATABASE_URL` secret on a push to `main`.
- The Docker runtime build is defined in CI but was not run locally because a
  live Docker daemon is not required for this task.
- The workflow performs migration handoff only; no application deployment
  provider is available or configured.
- Existing `copilot-setup-steps.yml` remains a separate, path-scoped setup
  workflow and is outside this quality-gate change.
