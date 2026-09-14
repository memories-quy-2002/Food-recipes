# Production Demo Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a manually triggered, CI-gated GitHub Actions workflow that can replace the production-demo database contents with the existing Prisma demo seed and optionally clear the configured Supabase Storage bucket.

**Architecture:** Keep the existing Prisma migrations and TypeScript seed. Add a production-only reset script that truncates an explicit allowlist of application tables while preserving migration metadata and Supabase-managed schemas. Run it from a `workflow_dispatch` workflow protected by a GitHub Environment, exact confirmations, project/host allowlists, a successful Quality Gates run for the same commit, and post-seed verification.

**Tech Stack:** Node.js 24, TypeScript, Prisma 7, PostgreSQL, Supabase Storage REST API, GitHub Actions.

## Global Constraints

- The workflow must have `workflow_dispatch` as its only trigger.
- The workflow must run only from `master` and require a successful `quality-gates.yml` run for the same commit.
- Production reset requires exact confirmation strings, an environment secret enable switch, an expected Supabase project ref, and an expected database host.
- The reset must never execute `prisma migrate reset` or drop `public`/Supabase-managed schemas.
- The reset must preserve `_prisma_migrations` and truncate only the explicit application-table allowlist.
- Supabase Storage objects must be deleted through the Storage API, never with SQL against `storage.objects`.
- Secrets and production URLs must remain in GitHub Environment secrets and never be committed or logged.
- The workflow must verify the expected demo graph after seeding: 3 users, 3 categories, 3 meals, 25 recipes, 25 wishlist rows, 25 ratings, 25 fully linked recipes, and 0 orphan recipes.

---

### Task 1: Add guarded production reset and storage cleanup script

**Files:**
- Create: `src/backend/scripts/production-demo-reset.ts`
- Test: `src/backend/test/production-demo-reset.validation.mjs`

**Interfaces:**
- Consumes: `DATABASE_URL`, `NODE_ENV`, `PRODUCTION_DEMO_RESET_ENABLED`, `PRODUCTION_DEMO_PROJECT_REF`, `PRODUCTION_DEMO_DB_HOST`, `DEMO_RESET_PROJECT_REF`, `DEMO_RESET_CONFIRM`, `DEMO_RESET_BACKUP_CONFIRMED`, `DEMO_RESET_STORAGE`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_RECIPE_BUCKET`.
- Produces: `main()` that truncates the explicit application-table allowlist, runs the existing Prisma demo seed, optionally removes all objects from the configured Supabase Storage bucket through REST, and exits non-zero on any guard, database, seed, or storage failure.

- [ ] **Step 1: Define the table allowlist and exact guard constants.**

  The allowlist must include `accounts`, `categories`, `meals`, `recipes`, `recipe_ingredients`, `recipe_nutrition`, `recipe_dietary_tags`, `wishlist`, `rating`, `saved_collections`, `saved_collection_items`, `review_reports`, `recipe_allergens`, `recipe_notes`, `pantry_items`, `meal_plans`, `meal_plan_items`, `shopping_list_items`, `auth_sessions`, `password_reset_tokens`, and `email_verification_tokens`, while excluding `_prisma_migrations`, `auth.*`, and `storage.*`.

- [ ] **Step 2: Implement production/project/host/confirmation validation.**

  Reject the operation unless `NODE_ENV=production`, `PRODUCTION_DEMO_RESET_ENABLED=true`, `DEMO_RESET_PROJECT_REF` equals `PRODUCTION_DEMO_PROJECT_REF`, `DEMO_RESET_CONFIRM=RESET_FOOD_RECIPES_PRODUCTION`, `DEMO_RESET_BACKUP_CONFIRMED=BACKUP_VERIFIED`, `DATABASE_URL` parses as a PostgreSQL URL, and its hostname equals `PRODUCTION_DEMO_DB_HOST`.

- [ ] **Step 3: Implement the database reset with a session advisory lock and transaction.**

  Connect through the existing Prisma PostgreSQL adapter, set lock and statement timeouts, acquire a transaction-scoped advisory lock, run `TRUNCATE TABLE <quoted allowlist> RESTART IDENTITY CASCADE` in an interactive transaction, and disconnect. Roll back on failure and never log the connection string.

- [ ] **Step 4: Implement optional Storage cleanup using the Storage API.**

  When `DEMO_RESET_STORAGE=true`, require `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_RECIPE_BUCKET`; recursively list objects in batches, remove them in batches of at most 1000 through the Storage API `DELETE /storage/v1/object/{bucket}` endpoint with `{ prefixes }`, and fail on any non-2xx response. Do not issue SQL against `storage.objects`.

- [ ] **Step 5: Add static safety validation.**

  Validate that the script contains the production guard, exact confirmation, expected-host check, application-table allowlist, `_prisma_migrations` exclusion, and Storage API path, and that it does not contain `migrate reset`, `DROP SCHEMA`, or `storage.objects` deletion SQL.

### Task 2: Add demo verification and package commands

**Files:**
- Create: `src/backend/scripts/verify-demo-seed.ts`
- Modify: `src/backend/package.json`

**Interfaces:**
- Consumes: `DATABASE_URL` and the generated Prisma client.
- Produces: `demo:reset:production` and `demo:verify` commands with machine-checkable non-zero failures.

- [ ] **Step 1: Implement verification queries.**

  Verify exact counts for users, categories, meals, recipes, wishlist rows, ratings, fully linked recipes, and orphan recipes; print only counts and never credentials.

- [ ] **Step 2: Add package scripts.**

  Add `demo:reset:production`: `ts-node --transpile-only scripts/production-demo-reset.ts` and `demo:verify`: `ts-node --transpile-only scripts/verify-demo-seed.ts`.

- [ ] **Step 3: Run local typecheck for the new scripts without executing the production reset.**

  Run `corepack pnpm@11.18.0 run typecheck` and confirm the reset script is not invoked.

### Task 3: Add the manual CI-gated production workflow

**Files:**
- Create: `.github/workflows/production-demo-reset.yml`

**Interfaces:**
- Consumes: GitHub Environment `production-demo-reset`, its secrets, and manual inputs `confirm`, `backup_confirm`, `project_ref`, and `clear_storage`.
- Produces: A manual workflow that checks Quality Gates for the same commit, waits for environment approval, runs migrations, resets data, seeds, and verifies.

- [ ] **Step 1: Define only the `workflow_dispatch` trigger and manual inputs.**

  Require exact confirmation and backup strings, the expected project ref, and a boolean Storage cleanup choice.

- [ ] **Step 2: Add a preflight job.**

  Require `master`, query GitHub Actions for a successful `quality-gates.yml` run for `$GITHUB_SHA`, and fail before the protected job when CI or inputs are invalid.

- [ ] **Step 3: Add the protected production job.**

  Set `environment: production-demo-reset`, install the locked backend dependencies, run `pnpm prisma:migrate:deploy`, run `pnpm demo:reset:production` (truncate, seed, and optionally clear Storage), and run `pnpm demo:verify`.

- [ ] **Step 4: Pass only environment secrets to the protected job.**

  Use `PRODUCTION_DATABASE_URL`, `PRODUCTION_DEMO_RESET_ENABLED`, `PRODUCTION_DEMO_PROJECT_REF`, `PRODUCTION_DEMO_DB_HOST`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_RECIPE_BUCKET`; do not echo them.

### Task 4: Document setup and manual runbook

**Files:**
- Create: `docs/production-demo-reset.md`

- [ ] **Step 1: Document required GitHub Environment and secrets.**

  Explain the required environment name, required reviewers, secret names, and that `PRODUCTION_DATABASE_URL` must use an appropriate session/direct connection for administrative operations.

- [ ] **Step 2: Document the manual execution sequence.**

  Explain that Quality Gates must pass on `master`, an operator must verify backup/PITR, the workflow is started manually, the Environment approval is required, and the verification output must be reviewed.

- [ ] **Step 3: Document storage behavior and rollback boundary.**

  State that database reset and Storage object deletion are separate operations, Storage deletion is irreversible through the API, and a database backup does not restore Storage objects.

### Task 5: Verify the implementation

- [ ] **Step 1: Run the static validator for the new reset script and workflow.**

  Run `node src/backend/test/production-demo-reset.validation.mjs` and require exit code 0.

- [ ] **Step 2: Run backend checks.**

  From `src/backend`, run `corepack pnpm@11.18.0 run check` and `corepack pnpm@11.18.0 run build`.

- [ ] **Step 3: Validate the workflow YAML and inspect the final diff.**

  Confirm the workflow is manual-only, the reset job has `needs: preflight`, the protected environment is present, no production reset command is used, and unrelated worktree changes are not staged.

- [ ] **Step 4: Do not run the production workflow from the local agent.**

  The final handoff must state that only the repository-side workflow and guards were verified; production reset requires the operator to trigger and approve it in GitHub Actions.
