# SDD Task 11 Report

## Data-shape evidence

- The persisted recipe schema defines `ingredients text[]` and has no servings/yield column: `src/server/recipe.sql:175-186`.
- The create route is `POST /recipes`; there is no recipe create/edit servings contract in `src/server/routes.js:17-20` (the only recipe mutation route besides create is delete).
- The create handler destructures recipe fields without `servings`/`yield` and inserts only name, description, taxonomy, times, ingredients, instructions, owner, and image URL: `src/server/queries.js:610-622`, `src/server/queries.js:642-658`.
- The current editor submits `recipeIngredients` as trimmed strings and sends the create payload through `axios.post`: `src/client/features/recipes/AddRecipe.jsx:255-309`.

Conclusion: adding a servings editor field would be silently discarded by the current backend, and there is no edit API to preserve it. No fake create/edit persistence was added. Automatic ingredient scaling was also deferred because the actual ingredient contract is free-text `text[]`, not structured quantity/unit data.

## Changes

- `src/client/features/recipes/recipeContent/RecipeDescription.jsx`
  - Added a local servings control with a default of 4 when the payload has no servings value.
  - Clamps values to 1–99 and exposes native, keyboard-accessible decrease/increase buttons.
  - Keeps the selected serving value visible with `aria-live="polite"`.
  - Resets local servings from the incoming recipe when its stable identity changes, so state cannot leak between recipes in a mounted detail view.
  - Preserves free-text ingredient strings exactly and explains why quantities are not scaled. Ingredient objects are treated as unsupported data and rendered without selecting or scaling a partial `name` shape.
  - Exported `normalizeServings` for focused tests.
- `src/client/features/recipes/Recipe.scss`
  - Added compact responsive control styling and note styling without changing the existing metadata grid structure.
- `src/client/features/recipes/RecipeServings.task11.test.jsx`
  - Added focused tests for identity reset, 1/99 disabled no-op boundaries, native button semantics, unsupported ingredient objects, visible selection changes, and preservation of free-text quantities.
- `src/client/features/recipes/RecipeDetail.task10.test.jsx`
  - Updated the prior absent-servings assertion to match the new stable local control.

## Verification

- RED: `pnpm exec vitest run src/client/features/recipes/RecipeServings.task11.test.jsx` failed before implementation because `normalizeServings` and the note/control were absent.
- Focused tests: `pnpm exec vitest run src/client/features/recipes/RecipeServings.task11.test.jsx src/client/features/recipes/RecipeDetail.task10.test.jsx` — 2 files, 8 tests passed.
- Build: `pnpm run build` — passed with Vite production output.
- Formatting check: `git diff --check` — passed; only line-ending warnings were reported by Git on existing Windows working-copy files.
- Repository-wide `pnpm test -- --run` — not a usable aggregate command for this mixed workspace: 14 suites failed during collection/configuration (frontend JSX parsing, Playwright hooks under Vitest, and Jest globals missing), while 40 unrelated tests passed. No unrelated test/config files were changed.

## Limitations

- Servings are display/session state on recipe detail only; refreshing or saving cannot persist the selected value.
- Create/edit servings support remains blocked until the backend schema, read DTO/query, and create/edit API accept and return a servings/yield field.
- Automatic scaling remains intentionally deferred until ingredients are represented by an explicit structured quantity/unit contract. Existing free-text ingredient text is not rewritten, and unsupported objects are not silently treated as structured ingredients.
- No runtime browser/API flow was claimed; the verification above is focused component tests and a production build.
