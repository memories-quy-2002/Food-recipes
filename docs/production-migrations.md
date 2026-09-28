# Production Prisma migrations

Last reviewed: 2026-09-22

This guide covers forward Prisma migrations, the one-time baseline, and the separate destructive demo reset. All production operations are started manually from `master`.

## Required full CI run

1. Merge the migration change to `master`.
2. Open **Actions > Quality Gates > Run workflow** and select `master`. Manual dispatch forces the static validators, backend checks, frontend checks, frontend quality journeys, and API tests to run even when path filtering would skip a package.
3. Wait until the run for the exact master commit succeeds. If any job fails, fix the issue and repeat the full run on the new commit.
4. Only then dispatch the intended production database workflow from that same commit.

Each production workflow checks that the latest manually dispatched Quality Gates run on its exact `GITHUB_SHA` completed successfully and fails closed otherwise. The workflows do not run on pushes or pull requests.

## Forward migrations

Use [Production Database Migration](../.github/workflows/production-migrate.yml) for normal schema changes. It runs Prisma validation, verifies that the entered project ref and database hostname match the configured production target, applies pending migrations with `prisma migrate deploy`, and checks the resulting migration status.

Before dispatch:

- Rehearse the migration against a disposable database restored from a recent backup or against staging.
- Review the generated migration SQL and consider lock duration, table size, data backfills, and whether the change needs multiple deploy steps.
- Create or confirm a recoverable production backup/PITR point. Enter its reference in the workflow. The workflow requires a non-empty reference; an operator must confirm that the backup/PITR point exists and is usable.
- Confirm the production Supabase project ref and the configured database hostname.

Dispatch from `master` and enter exactly `APPLY_FOOD_RECIPES_PRODUCTION_MIGRATIONS`, the verified backup/PITR reference, and the configured project ref. The job validates the target before connecting Prisma to it. It uses `prisma migrate deploy`; it does not reset application data or run the seed.

The migration job shares a concurrency group with baseline and reset jobs, so these checked-in production database workflows cannot mutate the database at the same time. See [CI/CD and release operations](./ci-cd.md) for the Environment and secret setup. Environment approval and branch restrictions only apply when configured in GitHub repository settings.

## One-time existing-database baseline

Use [Production Prisma Baseline](../.github/workflows/production-prisma-baseline.yml) only when adopting Prisma Migrate for an existing schema that has no matching migration history. It marks `0_init` as applied and deploys later migrations. It is not the normal workflow for future schema changes.

Before dispatch, follow the schema inspection and backup procedure in [the Prisma baseline guide](../src/backend/README.prisma.md). In particular, reconcile the documented `recipes.image_url` evidence discrepancy and compare the live schema with `0_init`. Do not confirm `SCHEMA_VERIFIED` until the comparison proves they match. Dispatch from `master` after a successful full Quality Gates run on that exact commit; enter `BASELINE`, `SCHEMA_VERIFIED`, the verified backup/PITR reference, and the configured project ref.

A baseline is a migration-metadata operation against a data-bearing database. If the live schema does not match the baseline, stop and resolve the discrepancy before using this workflow. Never use `prisma migrate reset` on production.

## Production demo reset and seed

[Production Demo Reset](../.github/workflows/production-demo-reset.yml) is a separate destructive operation. It first validates the target, reset enable switch, explicit reset and backup confirmations, and Storage configuration when selected. Only then does it deploy pending migrations, truncate the application-table allowlist, run the demo seed, and verify the seeded graph.

Follow the [production demo reset runbook](./production-demo-reset.md). Storage deletion is off by default and irreversible through the Storage API. A failed reset or seed does not roll back migrations or restore truncated rows automatically; inspect the failed run and recover from the verified backup when needed.

## GitHub Environment setup

The migration, baseline, and reset jobs use the existing `production-demo-reset` Environment so they can share its production database secrets. Keep production values in Environment secrets, not repository files or frontend build variables:

- `PRODUCTION_DATABASE_URL`
- `PRODUCTION_DEMO_PROJECT_REF`
- `PRODUCTION_DEMO_DB_HOST`
- `PRODUCTION_DEMO_RESET_ENABLED` (reset kill switch)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_RECIPE_BUCKET` (reset Storage cleanup)

Configure this Environment for `master`. If the repository's GitHub plan and visibility support required reviewers, configure a reviewer so the mutating job waits for approval after CI passes. The workflow files cannot confirm these external settings. On plans where GitHub does not offer required reviewers for this repository, the manual dispatch, exact confirmation, same-commit full CI check, and target validation still apply.
