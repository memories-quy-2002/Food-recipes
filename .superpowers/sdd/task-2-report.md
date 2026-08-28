# Task 2 report: preferences backend API

Date: 2026-08-28
Branch: `feat/p0-p1-growth-retention`

## Scope and worktree boundary

Implemented Task 2 from `.superpowers/sdd/task-2-brief.md` on top of Task 1 commit `2898b5b`. The two pre-existing untracked documents were preserved and were not staged:

- `docs/superpowers/plans/2026-08-28-food-recipes-p0-p1-growth-retention-plan.md`
- `docs/superpowers/specs/2026-08-28-food-recipes-p0-p1-growth-retention-design.md`

## Implementation

- Added the authenticated versioned preferences module and registered it in `AppModule`.
- Added `GET /api/v1/users/me/food-preferences` and `PUT /api/v1/users/me/food-preferences` under `JwtAuthGuard`.
- Added DTO validation for servings, weekday cooking time, calories, protein, child-array sizes and string lengths.
- Applied defaults of `defaultServings: 2` and `strictDislikes: false` when no stored value exists.
- Normalized scalar strings by trimming empty values to `null` and normalized child arrays by trimming, dropping blanks and deduplicating while preserving order.
- Replaced the scalar row and all three child collections in one Prisma interactive `$transaction`; child rows are deleted and reinserted from the normalized values.
- Passed only `@CurrentUser().id` into service methods. The request DTO has no client-owned actor field.
- Updated the strict Swagger route inventory for the two new routes.

## Files changed

Created:

- `src/backend/src/modules/preferences/preferences.module.ts`
- `src/backend/src/modules/preferences/preferences.controller.ts`
- `src/backend/src/modules/preferences/preferences.service.ts`
- `src/backend/src/modules/preferences/preferences.repository.ts`
- `src/backend/src/modules/preferences/dto/update-food-preferences.dto.ts`
- `src/backend/src/modules/preferences/preferences.service.spec.ts`
- `.superpowers/sdd/task-2-report.md`

Modified:

- `src/backend/src/app.module.ts`
- `src/backend/src/bootstrap/swagger.bootstrap.spec.ts`

## TDD RED/GREEN evidence

### RED

After adding the focused test file and before adding the production module files:

```text
corepack pnpm@11.18.0 test -- preferences --runInBand
```

Result: failed as expected because the new controller, repository, service and DTO modules did not exist. Jest reported `TS2307 Cannot find module` for those four production imports.

### GREEN

After implementing the module:

```text
corepack pnpm@11.18.0 test -- preferences --runInBand
```

Result:

```text
Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
```

The focused tests cover empty-user defaults, trimming and deduplication, servings bounds, nutrition bounds, authenticated actor forwarding for reads and writes, repository reads, and transactional replacement.

## Verification

The exact pinned check command was attempted:

```text
corepack pnpm@11.18.0 check
```

It was blocked before running the check because this environment invokes pnpm `11.24.0` and rejects the repository's pinned `packageManager` value `11.18.0`.

The direct equivalent completed successfully:

```text
pnpm run check
```

Result:

```text
Test Suites: 39 passed, 39 total
Tests:       182 passed, 182 total
User food preferences migration validation passed.
```

Additional verification:

```text
pnpm run prisma:validate
```

Result: Prisma reported that `prisma/schema.prisma` is valid.

```text
pnpm run build
```

Result: production TypeScript build completed successfully.

```text
git diff --check
```

Result: passed with no whitespace errors.

## Self-review

- Both routes use the existing versioned controller convention and are guarded by `JwtAuthGuard`.
- Controller methods derive ownership from `AuthUser.id`; no request body actor ID is accepted by the DTO or passed to the repository.
- Empty preference rows preserve nullable fields while returning the required serving and strict-dislike defaults.
- All scalar and child writes occur inside one `$transaction` callback, so partial replacement cannot be committed.
- The repository uses the generated Prisma model delegates and the generated field names from Task 1 rather than introducing raw SQL or a new persistence pattern.
- The strict Swagger route test was updated only because registering the requested routes necessarily changes its expected route count.
- No Prisma schema, migration, frontend code, or unrelated worktree files were changed.

## Concerns

- The pinned `corepack pnpm@11.18.0 check` command remains environment-blocked by the existing Corepack/pnpm version mismatch. The direct `pnpm run check` equivalent is green.
- No live database integration test was added because the task brief requested the focused service/API test file and the existing backend verification suite is unit/contract based.
