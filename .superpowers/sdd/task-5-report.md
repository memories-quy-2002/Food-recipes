# Task 5 Report: Make Search Fully Keyboard Accessible

## Status

Implemented and committed as `fix(web): make recipe search keyboard accessible`.

## Scope

- Updated `src/client/features/home/main/HomeSearchBar.jsx` only for production behavior.
- Added `src/client/features/home/main/HomeSearchBar.keyboard.test.jsx` for focused interaction coverage.
- Preserved React Router `useSearchParams` query synchronization and quick-filter buttons.
- No backend, plan, package-manager, or generated-artifact changes were made for Task 5.

## Behavior implemented

- Search input now exposes `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-autocomplete`, and `aria-activedescendant`.
- Search results expose `role="listbox"`; each recipe result exposes `role="option"` and `aria-selected`.
- ArrowDown moves to the next result, wrapping at the end.
- ArrowUp moves to the previous result, wrapping from the first result.
- Enter navigates to the active recipe detail URL.
- Escape closes the result popup and clears the active descendant while leaving the query/input synchronized.
- Empty results are announced through the live listbox and an option containing `No recipe found`.
- Result options use `tabIndex={-1}`, keeping normal keyboard focus on the input and avoiding a focus trap. Quick-filter buttons remain normal keyboard-reachable buttons.
- Mouse result selection continues to navigate to `/recipe?id=<recipe_id>`.

## Verification

- Focused Vitest: 2 files, 8 tests passed.
- `corepack pnpm run build`: passed.
- `git diff --check`: passed.

## Known concerns

- The repository's existing TestRenderer-based suite emits pre-existing React deprecation/act warnings and an existing list-key warning; these do not fail the focused tests.
- The broad Vitest suite was not used because the task brief documents known unrelated discovery failures.

## Browser verification

Command:

```text
corepack pnpm exec playwright test e2e/current-user-journeys.spec.js -g "accessible keyboard behavior"
```

## Backend Task 5 completion note

The retroactive backend scope was committed as `02081a7` with only the three
scoped implementation files. The report remains ignored by the repository's
SDD configuration and was intentionally not included in that commit.

---

# Retroactive Backend Task 5 Report: Baseline Prisma Migrate

## Status

Implemented locally; no database connection or mutation was attempted.

## Scope

- Added `src/backend/apps/api/prisma/migrations/0_init/migration.sql` as a
  create-schema baseline from the checked-in Prisma schema.
- Preserved the evidenced positive `prep_time`/`cook_time` checks and all seven
  named legacy foreign keys with their delete/update actions.
- Added `src/backend/apps/api/README.md` with backup, disposable-copy,
  inspection, baseline-resolution, and status procedures.
- Added `src/backend/apps/api/test/prisma-baseline.validation.mjs` for static
  schema, constraint, safety, and evidence checks that do not require Docker or
  PostgreSQL.
- Preserved the existing frontend Task 5 report above; this addendum records the
  retroactive backend baseline evidence and remains scoped to Task 5.

## Important evidence discrepancy

Known legacy evidence discrepancy: the checked-in `prisma/schema.prisma`
declares nullable `Recipe.imageUrl` mapped to `recipes.image_url`, and the
baseline migration includes that nullable `image_url` column. The checked-in
`recipes.sql` evidence omits `image_url` from both the `CREATE TABLE
public.recipes` definition and the `COPY public.recipes` column list. The
application schema and migration remain internally consistent with
`image_url`, but static validation cannot prove that the existing legacy
database has this column.

Before `prisma migrate resolve --applied 0_init`, inspect the live database or
a disposable restored copy and reconcile this exact discrepancy. The static
validator detects and documents the mismatch; it does not claim that baseline
application is safe or that migration history is complete.

## Verification

- `corepack pnpm exec prisma validate --config prisma.config.ts`: passed with an
  unreachable placeholder `DATABASE_URL` and no database connection.
- `corepack pnpm exec prisma generate --config prisma.config.ts`: passed.
- `node test/prisma-baseline.validation.mjs`: passed without Docker or database
  access and reported the documented `image_url` discrepancy.
- `corepack pnpm --filter @food-recipes/api run build`: passed.
- `git diff --check`: passed for the worktree and staged scoped files.

## Limitations

`prisma migrate resolve --applied 0_init` and `prisma migrate status` were not
run because this task explicitly prohibits connecting to or mutating a
database. Live schema matching and migration-history status remain operator
responsibilities after backup and disposable-copy rehearsal.

Exact output:

```text
[WebServer] (node:35072) Warning: The 'NO_COLOR' env is ignored when the 'FORCE_COLOR' env is set.
[WebServer] $ vite build
[WebServer] (node:37084) Warning: The 'NO_COLOR' env is ignored when the 'FORCE_COLOR' env is set.
[WebServer] (node:35520) Warning: The 'NO_COLOR' env is ignored when the 'FORCE_COLOR' env is set.
[WebServer] (node:18236) Warning: The 'NO_COLOR' env is ignored when the 'FORCE_COLOR' env is set.

Running 1 test using 1 worker

(node:39956) Warning: The 'NO_COLOR' env is ignored when the 'FORCE_COLOR' env is set.
(Use `node --trace-warnings ...` to show where the warning was created)
  ok 1 [chromium] › e2e\current-user-journeys.spec.js:137:5 › guest navigates Home search results with accessible keyboard behavior (870ms)

  1 passed (3.4s)
```
