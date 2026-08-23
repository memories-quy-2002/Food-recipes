# API database baseline

## Run the Compose API locally

Both Compose contracts require `JWT_SECRET` explicitly. Do not commit a secret
or put one in a Compose file. Generate a random local value before starting the
stack:

```powershell
$env:JWT_SECRET = (node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('base64url'))")
Set-Location src/backend
docker compose --project-directory . -f infrastructure/docker/docker-compose.dev.yml up --build
```

The same variable is required for the production-like Compose file. The API
validation also rejects predictable development markers, so use a fresh
random-looking value of at least 32 characters. The command above changes only
the current PowerShell session.

`prisma/migrations/0_init/migration.sql` is the baseline for the legacy
Food Recipes PostgreSQL schema. It is a create-schema artifact based on the
checked-in Prisma datamodel and evidenced legacy constraints, including the
legacy `interval` duration columns and mapped table/column names. It contains
schema statements only; it does not contain application data or sequence
state.

The legacy dump uses PostgreSQL's default `timestamp without time zone`
precision of 6 for `accounts.created_on`, `accounts.last_login`, and every
`date_added` column. The checked-in Prisma schema makes that contract explicit
with `@db.Timestamp(6)`, and the baseline emits `TIMESTAMP(6)` accordingly;
this records precision without changing application behavior.

The legacy `wishlist.date_added` column is nullable and defaults to
`CURRENT_TIMESTAMP`. `Wishlist.dateAdded` is therefore an optional
`DateTime?` with `@default(now())`, and the baseline keeps the column nullable
as `TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP`. Explicit null legacy values remain
representable while new rows that omit the field still receive the database
default.

## Known evidence discrepancy

Known legacy evidence discrepancy: the checked-in `prisma/schema.prisma`
declares nullable `Recipe.imageUrl` mapped to `recipes.image_url`, and the
baseline migration includes that nullable `image_url` column. The
checked-in `recipes.sql` evidence omits `image_url` from both the `CREATE TABLE
public.recipes` definition and the `COPY public.recipes` column list. This evidence
file is stored under `prisma/legacy/`. The
application schema and migration remain internally consistent with
`image_url`, but static validation cannot prove that the existing legacy
database has this column.

Before `prisma migrate resolve --applied 0_init`, inspect the live database or
a disposable restored copy and reconcile this exact discrepancy. Do not mark
`0_init` as applied until that inspection confirms the schema that the
application and migration will use. The static validator detects and
documents this mismatch; it does not claim that baseline application is safe
or that migration history is complete.

## Safe baseline procedure

The commands below are an operator procedure. They were not run for this
change because this task must not connect to or mutate a database.

1. Set `DATABASE_URL` to the database being inspected. Never put credentials
   in a committed file or shell history.
2. Make a verified backup of the data-bearing database before any migration
   metadata change:

   ```bash
   pg_dump --format=custom --file=food-recipes-before-prisma-baseline.dump "$DATABASE_URL"
   ```

3. Restore that dump into a disposable development database, and use that
   copy for inspection and rehearsal. Do not use a shared or production
   database as the rehearsal target:

   ```bash
   pg_restore --dbname="$DEV_DATABASE_URL" --no-owner --exit-on-error food-recipes-before-prisma-baseline.dump
   ```

4. Inspect the migration and compare its tables, mapped columns, interval
   fields, defaults, and indexes with the existing schema and the backup:

   ```bash
   Get-Content .\prisma\migrations\0_init\migration.sql
   pnpm exec prisma migrate diff --from-empty --to-schema .\prisma\schema.prisma --script --config prisma.config.ts
   ```

5. Only after the schema is confirmed to match exactly, record the baseline as
   applied on the matching existing database. This changes Prisma migration
   metadata; it does not create the baseline tables:

   ```bash
   pnpm exec prisma migrate resolve --applied 0_init --config prisma.config.ts
   ```

6. Confirm migration history on that same approved database:

   ```bash
   pnpm exec prisma migrate status --config prisma.config.ts
   ```

For a new empty development database, `prisma migrate deploy` may execute the
baseline through the Docker `migrate` service. The existing-schema procedure
above is different: inspect first, then mark `0_init` as applied, then check
status. A successful local static check is not evidence that either metadata
operation succeeded against a live database.

## Safety prohibition

Never run `prisma migrate reset` against the data-bearing database. Do not use
the reset command as a shortcut for resolving a baseline mismatch. Stop and
restore the backup or rehearse against a disposable copy if the schema does
not match exactly.

The migration service in `src/backend/infrastructure/docker/docker-compose.yml` runs
`prisma migrate deploy`; it is not a substitute for the backup, inspection,
and baseline-resolution procedure for an existing database.

## Static verification

From `src/backend`, run the following checks without Docker or a database
connection:

```bash
node test/prisma-baseline.validation.mjs
corepack pnpm@11.18.0 prisma:validate
corepack pnpm@11.18.0 prisma:generate
corepack pnpm@11.18.0 build
corepack pnpm@11.18.0 typecheck
```

These checks verify the checked-in artifacts only. They do not prove that a
live database matches the baseline or that `migrate resolve`/`migrate status`
has succeeded.

## Local demo seed

From `src/backend`, apply the checked-in migrations and run the repeatable demo
seed with:

```powershell
corepack pnpm@11.18.0 prisma:migrate:deploy
corepack pnpm@11.18.0 prisma:seed
```

The seed creates three demo users, three categories, three meals, three recipes,
four wishlist rows, and four ratings. Recipe rows reference the seeded author,
category, and meal IDs; wishlist and rating rows reference the corresponding
user and recipe IDs. It also writes both the normalized minute durations and
the legacy PostgreSQL interval durations. Re-running the seed refreshes only the
demo recipes and their dependent wishlist/rating rows; it does not reset the
database.

## Task 18 duration normalization deployment gate

The Task 18 migration is a gated artifact and has not been deployed. It adds
non-null native `recipes.prep_time_minutes` and `recipes.cook_time_minutes`
after an exact interval-to-minute backfill. The legacy `prep_time` and
`cook_time` interval columns remain intentionally present: Nest reads the
native columns, while Nest create/update dual-writes both representations so
the Express fallback remains coherent. Dropping the interval columns requires
a separate reviewed migration after rollback risk is accepted.

Before deployment, both of these preconditions must be complete:

1. Reconcile the baseline `image_url` discrepancy against the live database or
   a disposable restored copy, as documented above, after backup and schema
   inspection.
2. Prove live Nest/frontend parity for the current cutover, including the
   authenticated recipe and wishlist journeys; static tests are not a
   substitute for this gate.

Only after those preconditions and a disposable migration rehearsal may an
operator run the deployment procedure. No `prisma migrate deploy`, `prisma
migrate resolve`, or `prisma migrate status` command was run for Task 18.
