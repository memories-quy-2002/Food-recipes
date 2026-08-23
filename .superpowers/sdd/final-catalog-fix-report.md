# Final catalog completeness fix

## Findings

- `useAllRecipesQuery` delegates to `fetchAllRecipes`, which previously made one unparameterized `GET /recipes` request.
- The Nest recipe endpoint defaults to 20 rows and returns pagination metadata, while the legacy API can return an array or a non-paginated `{ recipes }` envelope.
- `RecipeProvider` consumers therefore required the query function to preserve legacy payloads and aggregate the Nest catalog.

## Changes

- `src/client/features/recipes/api/useRecipeQueries.ts`
  - Requests page 1 with `limit: 100` and preserves the supplied `AbortSignal`.
  - Aggregates sequential pages while valid metadata reports another page.
  - Returns the first response immediately for legacy arrays and non-paginated envelopes.
  - Treats malformed pagination and non-progressing page responses as a safe stop, preventing an infinite request loop.
- `src/client/features/recipes/api/useRecipeQueries.test.ts`
  - Added legacy array and non-paginated envelope coverage.
  - Added two-page Nest aggregation coverage with bounded request parameters and signal propagation.
  - Added non-progressing pagination guard coverage.
  - Preserved stable query-key and detail-query tests.

## Verification

- `corepack pnpm exec vitest run src/client/features/recipes/api/useRecipeQueries.test.ts` — passed, 1 file / 6 tests.
- `corepack pnpm typecheck` — passed.
- `git diff --check` — passed.

No live browser, API, or runtime validation was performed.
