# API database baseline

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

## Known evidence discrepancy

Known legacy evidence discrepancy: the checked-in `prisma/schema.prisma`
declares nullable `Recipe.imageUrl` mapped to `recipes.image_url`, and the
baseline migration includes that nullable `image_url` column. The checked-in
`recipes.sql` evidence omits `image_url` from both the `CREATE TABLE
public.recipes` definition and the `COPY public.recipes` column list. The
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

The migration service in `infrastructure/docker/docker-compose.yml` runs
`prisma migrate deploy`; it is not a substitute for the backup, inspection,
and baseline-resolution procedure for an existing database.

## Static verification

From `src/backend/apps/api`, run the following checks without Docker or a
database connection:

```bash
node test/prisma-baseline.validation.mjs
pnpm exec prisma validate --config prisma.config.ts
pnpm exec prisma generate --config prisma.config.ts
pnpm run build
pnpm exec tsc -p tsconfig.build.json --noEmit
```

These checks verify the checked-in artifacts only. They do not prove that a
live database matches the baseline or that `migrate resolve`/`migrate status`
has succeeded.
