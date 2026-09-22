# Production demo reset

Last reviewed: 2026-09-22

This runbook describes the manual workflow for replacing application data in the production demo environment with the Prisma demo graph.

The workflow only starts from `master`. It requires a successful manually dispatched Quality Gates run on the exact same commit, then validates reset configuration before applying any pending migration. Production migrations and reset/seed are not triggered by a push.

## One-time GitHub setup

Create or reuse a GitHub Environment named `production-demo-reset`. Configure it for the `master` branch and, when the repository plan and visibility allow it, add a required reviewer. Add these secrets to that Environment:

| Secret | Purpose |
| --- | --- |
| `PRODUCTION_DATABASE_URL` | Production PostgreSQL URL used by Prisma. Use a direct or session connection suitable for administrative transactions. |
| `PRODUCTION_DEMO_RESET_ENABLED` | Must be exactly `true` to enable the reset kill switch. |
| `PRODUCTION_DEMO_PROJECT_REF` | The only Supabase project ref allowed by this workflow. |
| `PRODUCTION_DEMO_DB_HOST` | Exact hostname in `PRODUCTION_DATABASE_URL`. |
| `SUPABASE_URL` | Supabase project URL for optional Storage cleanup. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Storage administration key. Never expose it to the frontend. |
| `SUPABASE_RECIPE_BUCKET` | Bucket to clear only when `clear_storage=true`. |

The production database URL and Storage service-role key must never be placed in repository files, frontend variables, workflow logs, or pull requests. Environment secrets become available to the job only after configured deployment protection rules pass.

## Manual execution

1. Merge the migration/reset change to `master`.
2. Manually dispatch **Quality Gates** on `master` and wait for every applicable job to succeed on the commit you intend to operate. Manual dispatch runs both backend and frontend groups, along with static validation.
3. Confirm that a production backup/PITR recovery point exists and is usable. Record its identifier.
4. Open **Actions > Production Demo Reset > Run workflow** on `master`.
5. Enter exactly:
   - `RESET_FOOD_RECIPES_PRODUCTION` for `confirm`.
   - `BACKUP_VERIFIED` for `backup_confirm`.
   - The backup/PITR identifier for `backup_reference`.
   - The configured project ref for `project_ref`.
6. Leave `clear_storage` false unless you intend to remove every object in the configured recipe image bucket.
7. Approve the `production-demo-reset` Environment job if approval is configured.
8. Review the final verification output: 4 users, 5 categories, 4 meals, 25 recipes, 13 wishlist rows, 40 rating rows, 8 pantry items, 1 meal plan with 6 items, 1 active cooking session, 1 cooking-history row, 25 fully linked recipes, and 0 orphan recipes.

The workflow requires a non-empty backup reference but cannot verify that the referenced backup is usable. That confirmation remains an operator responsibility. The reset script also checks the project ref, database host, PostgreSQL URL, enable switch, and exact confirmations before the migration step is allowed to run.

## Data and rollback boundary

After configuration validation, the workflow uses `prisma migrate deploy` for pending schema changes. It then truncates only the application tables listed in `src/backend/scripts/production-demo-reset.ts`, runs the seed, and verifies the demo graph. It preserves `_prisma_migrations` and never drops the `public`, `auth`, or `storage` schemas.

The reset truncation is transactional, but the complete migration, truncation, seed, and Storage sequence is not one transaction. A later failure does not roll back already applied migrations or restore truncated rows. Review the failed run and use the verified backup/recovery procedure before retrying.

Storage cleanup uses the Supabase Storage API with the service-role key. It does not modify `storage.objects` with SQL. Deleting Storage objects is irreversible through this API, and database backups do not restore Storage files. Keep `clear_storage` false unless the bucket should be cleared.

Never run `prisma migrate reset` against the data-bearing production database. The workflow is manual; CI passing only authorizes the next manual step and does not itself start a production operation.
