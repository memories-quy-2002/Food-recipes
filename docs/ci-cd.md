# CI/CD and release operations

Last reviewed: 2026-09-22

This guide describes the checked-in GitHub Actions and Vercel configuration.
It does not imply that GitHub branch protection, Environment approval settings,
Vercel project settings, or a production API host have been inspected outside
this repository.

## Continuous integration

### Quality Gates

[Quality Gates](../.github/workflows/quality-gates.yml) runs on pull requests,
pushes to `master`, and manual dispatch. It uses Node.js 24 and pnpm 11.18.0.
The workflow always runs repository static validators, then selects package
jobs from changed paths:

| Changed paths | Jobs |
| --- | --- |
| `src/frontend/**` | Frontend checks/build and mocked Playwright quality journeys |
| `src/backend/**` | Prisma validation/generation, backend checks, API E2E, build, and runtime Docker image build |
| `.github/**`, `.husky/**`, or `AGENTS.md` | Both package job groups |
| Documentation-only paths such as `docs/**`, `Wiki/**`, and `README.md` | Static validators; package jobs are skipped |
| Manual dispatch | Both package job groups |

The frontend quality job installs Chromium and runs
`pnpm test:e2e:quality`. It uploads Playwright results when available. The
broader `pnpm test:e2e:ci` suite and Docker-backed real-stack browser suite are
not run by this workflow.

The backend job starts an ephemeral `postgres:17-alpine` service, matching the
image in the local Compose configuration. After schema validation and Prisma
Client generation, it applies all migrations to the fresh database, runs the
demo seed, and verifies the seeded graph with `pnpm demo:verify`. It then runs
`pnpm check`, `pnpm test:e2e`, and `pnpm build`, and builds the Dockerfile's
`runtime` target. It discards this database at job end. The API image build is
a CI check; this workflow does not publish the image.

The workflow uses read-only repository permissions and cancels older in-progress
runs for the same pull request or ref. Its YAML does not configure GitHub branch
protection or establish that any status check is required before merge; review
those settings in the repository's GitHub configuration.

### Dependency security

[Dependency Security](../.github/workflows/dependency-security.yml) runs
dependency review and downgrade checks on pull requests that change package
manifests, lockfiles, or Dependabot configuration. Dependency review fails on
high severity findings. A scheduled run audits both packages at 03:17 UTC each
Monday; manual dispatch runs the same audits.

[Dependabot](../.github/dependabot.yml) checks frontend and backend npm
dependencies weekly on Monday at 03:00 Ho Chi Minh time, and GitHub Actions
dependencies at 03:30 Ho Chi Minh time.

## Continuous delivery

### Frontend

[src/frontend/vercel.json](../src/frontend/vercel.json) enables Git deployments
for `master` and disables them for other branches. The Vercel project must use
`src/frontend` as its root directory, run `pnpm build`, and serve `dist`.
The checked-in config includes SPA rewrites. Configure public frontend values
such as `VITE_API_BASE_URL` in Vercel's project settings; never put backend
secrets in frontend build variables.

### Backend

There is no checked-in workflow that publishes the API image to a registry or
deploys the API to a runtime host. Quality Gates builds
`src/backend/Dockerfile` as a validation step only. Select the registry and
runtime host before adding automatic API delivery; those destinations and
credentials are not defined in this repository.

## Database operations

Production database changes are manual workflows, separate from application
delivery. The migration, baseline, and demo reset workflows all require a
successful **manually dispatched full Quality Gates run** on the exact same
`master` commit. That run forces both package groups to execute despite the
normal changed-path filtering. The workflow checks the commit and fails closed
when no successful full run exists.

- [Production Database Migration](../.github/workflows/production-migrate.yml)
  applies pending Prisma migrations with `prisma migrate deploy`, then checks
  migration status. It does not reset or seed application data.
- [Production Prisma Baseline](../.github/workflows/production-prisma-baseline.yml)
  is a one-time workflow for adopting Prisma Migrate on an existing database.
  It requires backup and schema confirmations, marks `0_init` as applied, then
  deploys later migrations. Inspect [the baseline guide](../src/backend/README.prisma.md)
  before use.
- [Production Demo Reset](../.github/workflows/production-demo-reset.yml)
  validates reset configuration, applies pending migrations, truncates the
  application table allowlist, runs the demo seed, and verifies the resulting
  graph. Storage cleanup is an optional destructive input and defaults off.
  Follow the [reset runbook](./production-demo-reset.md).

All three workflows share the `production-demo-reset` GitHub Environment and
the `food-recipes-production-database` concurrency group. Configure the
Environment secrets and restrict it to `master`. Required reviewer approval
can be configured there when the repository plan and visibility support it.
Those settings are external to this checkout and have not been verified.
See the [production migrations runbook](./production-migrations.md) for the
preflight and recovery procedure.

## Local package gates

Run commands from each package directory:

~~~powershell
cd src/frontend
pnpm check
pnpm build
pnpm test:e2e:quality
~~~

~~~powershell
cd src/backend
corepack pnpm@11.18.0 prisma:validate
corepack pnpm@11.18.0 check
corepack pnpm@11.18.0 test:e2e
corepack pnpm@11.18.0 build
~~~

Use the [repository README](../README.md) for environment setup and real-stack
browser verification commands.
