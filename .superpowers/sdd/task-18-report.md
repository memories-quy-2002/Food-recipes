# Task 18 Report: Normalize Recipe Duration Schema

## Status

Implemented as a gated, DB-free artifact. No database connection or mutation
was attempted.

## Scope

- Added a timestamped Prisma migration that adds nullable native minute
  columns, backfills them with `ROUND(EXTRACT(EPOCH FROM interval)/60)::integer`,
  rejects null/non-positive results, adds positive checks, and then enforces
  `NOT NULL`.
- Retained legacy `prep_time` and `cook_time` interval columns. Nest reads the
  native columns and dual-writes both native minutes and legacy intervals on
  create/update for Express fallback compatibility.
- Updated wishlist recipe projections to read native minute columns and expose
  the derived `total_time_minutes` field.
- Added focused repository/service tests and a DB-free static migration
  validator.
- Documented the deployment gate: baseline `image_url` reconciliation and
  live Nest/frontend parity are required before deployment.

## Verification

The following checks were run without Docker or a database:

- `node test/recipe-duration-migration.validation.mjs`
- `corepack pnpm exec prisma validate --config prisma.config.ts`
- `corepack pnpm exec prisma generate --config prisma.config.ts`
- focused API Jest tests for recipe and wishlist repositories/services
- full API Jest suite
- API build and TypeScript build check
- `git diff --check`

`prisma migrate deploy`, `prisma migrate resolve`, and `prisma migrate
status` were intentionally not run.

## Limitations and deployment gate

The migration has not been applied to any database. Before deployment, inspect
the live or disposable-copy schema and reconcile the baseline `image_url`
discrepancy documented by Task 5. Then complete live Nest/frontend parity,
including authenticated recipe and wishlist flows. The legacy interval columns
remain until a separate reviewed removal migration.
