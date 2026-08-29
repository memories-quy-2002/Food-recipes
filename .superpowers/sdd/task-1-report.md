# Task 1 report: preference persistence

Date: 2026-08-28
Branch: `feat/p0-p1-growth-retention`

## Scope and worktree boundary

Implemented the preference persistence task from `.superpowers/sdd/task-1-brief.md` without changing unrelated features. The existing untracked design and implementation-plan documents were preserved and were not staged.

## Implementation

- Added `UserFoodPreference` to `src/backend/prisma/schema.prisma` with scalar diet, cooking, serving, nutrition and dislike fields, defaults, timestamps and the mapped `user_food_preferences` table.
- Added `UserAvoidedAllergen`, `UserDislikedIngredient` and `UserCuisinePreference` with mapped snake_case columns, composite uniqueness and user indexes.
- Added the additive migration `src/backend/prisma/migrations/20260828100000_user_food_preferences/migration.sql`.
- Added foreign keys to `accounts` with cascading deletes for all four models.
- Added the requested SQL checks for servings, weekday cook time, calories, protein and cuisine weight.
- Added `src/backend/test/user-food-preferences-migration.validation.mjs` to verify the schema and migration contract.

## Files changed

- `.superpowers/sdd/task-1-report.md`
- `src/backend/prisma/schema.prisma`
- `src/backend/prisma/migrations/20260828100000_user_food_preferences/migration.sql`
- `src/backend/test/user-food-preferences-migration.validation.mjs`

## TDD RED/GREEN evidence

RED, before the schema and migration implementation:

```text
corepack pnpm@11.18.0 exec node test/user-food-preferences-migration.validation.mjs
```

Result: failed as expected with `AssertionError: preference migration must exist`.

GREEN, after implementation and a correction to the contract test's dynamically constructed foreign-key regex:

```text
corepack pnpm@11.18.0 exec node test/user-food-preferences-migration.validation.mjs
```

Result: passed with `User food preferences migration validation passed.`

## Verification

```text
corepack pnpm@11.18.0 prisma:validate
```

Result: passed. Prisma reported that the schema is valid.

```text
pnpm run prisma:generate
```

Result: passed. Prisma Client 7.9.1 was generated into the ignored `src/backend/src/generated/prisma` directory, which was absent in the initial worktree.

```text
pnpm run check
```

Result: passed. TypeScript typecheck passed; Jest reported 38 passed suites and 174 passed tests.

```text
git diff --check
```

Result: passed for tracked changes.

The required pinned check command was also attempted:

```text
corepack pnpm@11.18.0 check
```

It stopped before running the check because this environment's Corepack invoked pnpm 11.24.0 and rejected the repository's pinned pnpm 11.18.0 package-manager setting. The direct equivalent `pnpm run check` passed after generating the missing Prisma client.

## Self-review

- The migration is additive and contains no `DROP TABLE` or `DROP COLUMN` statements.
- All four Prisma models and mapped snake_case table/column names match the task design.
- Required defaults, composite unique constraints, indexes, foreign keys and SQL bounds are represented in the migration.
- The contract test checks migration presence, table creation, ownership references, constraints, uniqueness, indexes, non-destructive SQL and schema model declarations.
- No API, frontend, existing model, migration or user-provided design/plan document outside the task scope was changed.

## Concerns

- The exact required `corepack pnpm@11.18.0 check` command remains environment-blocked by the installed Corepack/pnpm version mismatch. The direct backend check passed with all existing Jest suites green.

## Fix: Task 1 review findings

Date: 2026-08-28

### Files changed

- `.github/workflows/quality-gates.yml`
- `src/backend/package.json`
- `src/backend/test/ci-workflow.validation.mjs`
- `src/backend/test/user-food-preferences-migration.validation.mjs`

The Prisma schema and preference migration were not changed. The two untracked user documents were preserved and not staged.

### TDD and covering test evidence

RED, after temporarily removing only the `user_avoided_allergens` foreign-key line from the migration to prove the assertion was table-specific:

```text
corepack pnpm@11.18.0 exec node test/user-food-preferences-migration.validation.mjs
```

Output:

```text
AssertionError [ERR_ASSERTION]: user_avoided_allergens must reference accounts through user_id
    at file:///E:/Code/Food-recipes/src/backend/test/user-food-preferences-migration.validation.mjs:32:10
```

The migration was restored unchanged before the green verification.

RED, after adding the CI-contract expectation before adding the workflow entry:

```text
corepack pnpm@11.18.0 exec node test/ci-workflow.validation.mjs
```

Output:

```text
AssertionError [ERR_ASSERTION]: static must contain /user-food-preferences-migration\.validation.mjs/
    at assertJobContains (file:///E:/Code/Food-recipes/src/backend/test/ci-workflow.validation.mjs:41:10)
```

GREEN focused migration validator:

```text
corepack pnpm@11.18.0 exec node test/user-food-preferences-migration.validation.mjs
```

Output:

```text
User food preferences migration validation passed.
```

GREEN CI workflow validator:

```text
corepack pnpm@11.18.0 exec node test/ci-workflow.validation.mjs
```

Output:

```text
CI workflow validation passed for master release flow, Node 24, quality gates, and guarded production baseline/migrations.
```

Backend quality gate:

```text
pnpm run check
```

Output:

```text
$ pnpm run typecheck && pnpm run test:ci && pnpm run test:preferences-migration
$ tsc -p tsconfig.json --noEmit
$ jest --runInBand

Test Suites: 38 passed, 38 total
Tests:       174 passed, 174 total
Snapshots:   0 total
Time:        25.431 s
Ran all test suites.
$ node test/user-food-preferences-migration.validation.mjs
User food preferences migration validation passed.
```

Affected backend checks:

```text
pnpm run prisma:validate
```

Output:

```text
$ prisma validate --config prisma.config.ts
Loaded Prisma config from prisma.config.ts.

Prisma schema loaded from prisma\schema.prisma.
The schema at prisma\schema.prisma is valid 🚀
```

```text
pnpm run build
```

Output:

```text
$ tsc -p tsconfig.build.json
```

The pinned environment command was also re-run:

```text
corepack pnpm@11.18.0 check
```

Output:

```text
[ERROR] This project is configured to use 11.18.0 of pnpm. Your current pnpm is v11.24.0
Corepack invoked pnpm with this version, and pnpm does not switch versions when running under corepack.
```

### Self-review

- Each table definition is extracted through its own closing `);` before checking the `user_id` foreign key, so a valid FK in another table cannot satisfy the assertion.
- `test:preferences-migration` is part of the backend `check` script.
- The static quality-gates job invokes the validator, and `ci-workflow.validation.mjs` requires that entry to remain present.
- No schema or migration content remains changed by the temporary RED mutation.
- `git diff --check` passed with no output.
