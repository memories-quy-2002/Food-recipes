# Task 3: Stack Alignment — TanStack Query recipe cache

## Status

Implemented and verified on branch `codex/food-recipes-frontend-user-first`.

The shared recipe list fetch now uses TanStack Query v5 while preserving the existing `RecipeContext` compatibility surface and the existing API route compatibility layer. Backend files and the original product plan were not modified.

## Scope implemented

### Query hooks and contracts

Created `src/client/features/recipes/api/useRecipeQueries.ts` with:

- Stable keys:
  - `recipeQueryKeys.all`: `readonly ["recipes"]`
  - `recipeQueryKeys.list()`: `readonly ["recipes", "list"]`
  - `recipeQueryKeys.detail(recipeId)`: `readonly ["recipes", "detail", string]`
- `useAllRecipesQuery()` using TanStack Query v5 object syntax.
- `useRecipeQuery(recipeId)` using the existing detail route and preserving `data.recipe` envelope normalization.
- Typed list/detail fetchers using the existing Axios client, `apiRoutes`, `getArrayPayload`, and request abort signals.
- No invented API fields and no changes to legacy/Nest route compatibility behavior.

### RecipeProvider compatibility boundary

Updated `src/client/app/RecipeProvider.jsx` to remove its manual `useEffect`/`useState` fetch lifecycle and consume `useAllRecipesQuery()` under the existing app-level `QueryClientProvider`.

The provider still exposes:

- `recipes`
- `isLoadingRecipes`
- `recipesError`
- `refreshRecipes`

`refreshRecipes()` is now a thin wrapper around:

```js
queryClient.invalidateQueries({ queryKey: recipeQueryKeys.list() })
```

Error messages retain the current server-message fallback and generic fallback behavior.

### Publish and related-recipe consumers

- `AddRecipe.jsx` continues to call the existing compatibility `refreshRecipes()` boundary after a successful publish. That call now invalidates the shared query cache instead of issuing a duplicate manual fetch.
- `RecipeOtherList.jsx` now derives its shuffled related recipes with `useMemo`, removing its local derived state/effect cache while continuing to consume the compatibility context.
- Redux and auth/session state remain outside query data.

## Tests added

- `src/client/features/recipes/api/useRecipeQueries.test.ts`
  - Stable query keys.
  - List envelope normalization through `/recipes`.
  - Detail envelope preservation through `/recipes/:id`.
- `src/client/app/RecipeProvider.test.jsx`
  - Existing context value compatibility.
  - `refreshRecipes()` invalidation request.

## Verification

- `corepack pnpm vitest run src/client/features/recipes/api/useRecipeQueries.test.ts src/client/app/RecipeProvider.test.jsx` — 2 files passed, 4 tests passed.
- Focused Home/Wishlist/Recipe/AddRecipe compatibility tests — 9 files passed, 35 tests passed.
- `corepack pnpm typecheck` — passed.
- `corepack pnpm build` — passed.
- `git diff --check` — passed.

## Repository hygiene

Only Task 3 source/test files and this report are staged for the commit. Existing dirty reports, plans, Playwright artifacts, backend build metadata, and test-results artifacts remain unstaged and untouched. No backend file or original product plan was changed.

## Next boundary

The detail hook is intentionally covered as a tested migration boundary, but the existing `Recipe.jsx` detail component remains on its current manual detail fetch in this task. Migrating that component is a subsequent boundary and is outside Task 3’s exact scope.

## Concerns

- Vite reports the existing large JavaScript chunk warning during build; the build still completes successfully.
- No live API/browser flow was required by the brief; runtime API availability remains dependent on the configured legacy/Nest-compatible route target.

## Review follow-up: RecipeProvider error compatibility

The review finding was valid: the provider had introduced `error?.message` as an intermediate fallback, which could expose raw Axios error text and changed the prior compatibility contract.

Fixed `src/client/app/RecipeProvider.jsx` so `recipesError` now resolves only from:

1. `error?.response?.data?.message`, or
2. `"Unable to load recipes from the server."` when a query error exists, or
3. `null` when there is no query error.

Added a focused provider regression test in `src/client/app/RecipeProvider.test.jsx` using an Axios-shaped error with `{ response: { data: {} }, message: "Raw Axios error details" }`. The test first failed with the raw message, then passed after the production fix and asserts that the generic fallback is rendered instead.

Follow-up verification:

- `corepack pnpm vitest run src/client/features/recipes/api/useRecipeQueries.test.ts src/client/app/RecipeProvider.test.jsx` — 2 files passed, 5 tests passed.
- Existing Task 3 Home/Wishlist/Recipe/AddRecipe compatibility tests — 9 files passed, 35 tests passed.
- `corepack pnpm typecheck` — passed.
- `corepack pnpm build` — passed; the existing large-chunk warning remains non-fatal.
- `git diff --check` — passed.
