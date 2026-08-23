# Task 2 Report: Fix P0 Discovery Sorting Bugs

## Scope

Frontend-only Task 2 implementation. Unrelated backend files, workspace files, lockfiles, plans, and existing test artifacts were preserved.

## Changes

- `src/client/features/home/HomeMain.jsx`
  - Removed ad-hoc interval-string parsing for Quick Meals.
  - Added a compatibility normalizer for camelCase and NestJS snake_case numeric minute fields.
  - Added `totalTimeMinutes` and sorts Quick Meals with `byQuickest`.
  - Keeps legacy flat recipe objects usable; non-numeric legacy interval strings are not parsed and sort after numeric summaries.
  - Accepts both nested and legacy flat wishlist identity when checking/removing favorites.
- `src/client/features/wishlist/Wishlist.jsx`
  - Normalizes nested `{ recipe, savedAt }` wishlist items and legacy flat items.
  - Retains `savedAt` alongside the matched recipe and sorts Recently Saved descending with `byRecentlySaved`.
  - Preserves existing name and rating sort modes and rendering shape.
- `src/client/features/home/HomeMain.sorting.test.jsx`
  - Proves Quick Meals order by normalized total duration using both API field spellings.
- `src/client/features/wishlist/Wishlist.sorting.test.jsx`
  - Proves nested Saved items order by `savedAt` descending.

## Verification

- `corepack pnpm exec vitest run src/client/features/home/HomeMain.sorting.test.jsx src/client/features/wishlist/Wishlist.sorting.test.jsx` — passed: 2 files, 2 tests.
- `corepack pnpm run build` — passed.
- `git diff --check` — passed for the scoped diff.
- Manual browser check reached the local Vite app, but live order could not be observed: the recipe API was unavailable and unauthenticated Wishlist navigation redirected to Account. This is reported as runtime/environment evidence, not as a passing UI acceptance check.
- `corepack pnpm test -- --run` — broader discovery remains broken as expected: 11 suites failed across legacy `src/App.test.js`, backend Jest specs loaded by Vitest, and Playwright E2E setup. The two Task 2 tests still passed in that run.

## Concerns / follow-up

- Visible ordering should be rechecked against a running compatible API with an authenticated user and representative numeric recipe summaries plus distinct `savedAt` values.
- Legacy flat wishlist responses do not provide a save timestamp, so Recently Saved can only sort those entries when `savedAt` is present; no guessed recipe creation timestamp is used.
