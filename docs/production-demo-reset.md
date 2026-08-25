# Production demo reset

This runbook describes the manual GitHub Actions workflow for replacing the
contents of the production-demo environment with the Prisma demo graph.

The workflow is intentionally not an application endpoint. It runs only from
`master`, requires a successful `Quality Gates` run for the same commit, and is
paused behind the `production-demo-reset` GitHub Environment approval.

## One-time GitHub setup

Create a GitHub Environment named `production-demo-reset` and configure at
least one required reviewer. Add these secrets to that Environment:

| Secret | Purpose |
| --- | --- |
| `PRODUCTION_DATABASE_URL` | Production PostgreSQL URL used by Prisma. Use a direct or session connection suitable for administrative transactions. |
| `PRODUCTION_DEMO_RESET_ENABLED` | Must be exactly `true` to enable the reset kill switch. |
| `PRODUCTION_DEMO_PROJECT_REF` | The only Supabase project ref allowed by this workflow. |
| `PRODUCTION_DEMO_DB_HOST` | Exact hostname in `PRODUCTION_DATABASE_URL`. |
| `SUPABASE_URL` | Supabase project URL for Storage cleanup. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Storage administration key. Never expose it to the frontend. |
| `SUPABASE_RECIPE_BUCKET` | Bucket to clear when `clear_storage=true`. |

The production database URL and Storage service-role key must never be placed
in repository files, frontend variables, workflow logs, or pull requests.

## Manual execution

1. Merge the change to `master` and wait for `Quality Gates` to pass for that
   exact commit.
2. Confirm that the Supabase backup/PITR recovery point is usable.
3. Open **Actions → Production Demo Reset → Run workflow** on `master`.
4. Enter exactly:
   - `RESET_FOOD_RECIPES_PRODUCTION` for `confirm`.
   - `BACKUP_VERIFIED` for `backup_confirm`.
   - The configured project ref for `project_ref`.
5. Select whether to clear the configured Storage bucket.
6. Approve the `production-demo-reset` Environment deployment.
7. Review the final verification output: 3 users, 3 categories, 3 meals,
   25 recipes, 25 wishlist rows, 25 rating rows, 25 fully linked recipes,
   and 0 orphan recipes.

The workflow uses `prisma migrate deploy` for pending schema changes, then
truncates only the application tables listed in
`src/backend/scripts/production-demo-reset.ts`. It preserves
`_prisma_migrations` and never drops the `public`, `auth`, or `storage`
schemas.

## Storage and rollback boundary

Storage cleanup is performed through the Supabase Storage API with the
service-role key. It does not modify `storage.objects` with SQL. Deleting
Storage objects is irreversible through the API, and database backups do not
restore Storage files. If `clear_storage=true` is selected, verify the Storage
scope before approving the Environment deployment.

The workflow does not run automatically and the local agent must never trigger
it against production. A failed seed or verification leaves the environment in
the state reported by the failed job and requires operator recovery or a rerun.
