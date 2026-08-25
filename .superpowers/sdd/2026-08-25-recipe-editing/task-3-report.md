# Task 3 Report: Recipe edit persistence and lifecycle copy

## Summary

Implemented the owner recipe edit save lifecycle. `saveRecipeEdits` sequentially patches base data, replaces structured ingredients, nutrition, and dietary/allergen tags, then refreshes the recipe detail. Failed sections are surfaced without navigation or form reset.

The shared editor now provides lifecycle-aware edit actions: published recipes use `Save changes`; drafts provide `Save draft` and `Publish`; archived recipes reached through a direct edit URL present a restore action until they are restored to draft. Successful edit saves invalidate the public list/detail and owner recipe query keys, then navigate published recipes to detail and drafts to Personal Recipes.

## Files changed

- `src/frontend/features/recipes/recipeEditorApi.ts`
- `src/frontend/features/recipes/recipeEditorApi.test.ts`
- `src/frontend/features/recipes/RecipeEditor.jsx`
- `src/frontend/features/recipes/RecipeEditor.test.jsx`
- `src/frontend/features/recipes/RecipeEditor.accessibility.test.jsx`
- `src/frontend/features/recipes/EditRecipe.jsx`

`PersonalRecipes.jsx` already excluded archived recipes from Edit and retained its Restore action before this task, so it was intentionally not changed or staged.

## Verification

Commands run from `src/frontend`:

```powershell
& .\node_modules\.bin\vitest.cmd run features/recipes/recipeEditorApi.test.ts features/recipes/RecipeEditor.test.jsx features/recipes/RecipeEditor.accessibility.test.jsx
```

Result: PASS, 3 files and 10 tests.

```powershell
& .\node_modules\.bin\eslint.cmd features/recipes/RecipeEditor.jsx features/recipes/EditRecipe.jsx features/recipes/recipeEditorApi.ts features/recipes/recipeEditorApi.test.ts features/recipes/RecipeEditor.test.jsx features/recipes/RecipeEditor.accessibility.test.jsx
& .\node_modules\.bin\tsc.cmd --noEmit
```

Result: PASS.

The commit hook also ran `tsc -p tsconfig.json --noEmit` successfully.

## Commit

`4fb3ff067d5ee7bea9b18f827b959f5a6e89eec2` — `feat(recipes): enable editing owned recipes`

## Deviations and concerns

- No E2E coverage was added; that remains Task 4.
- The global `pnpm` launcher is broken in this environment, so verification used local package launchers. Focused Vitest execution also required elevated execution because sandboxed Vite could not load its native Tailwind module or spawn its helper process.
- The repository has extensive pre-existing modified and untracked files. Only the six Task 3 files above were staged and committed.

## Fix round 1: independent Luna review findings

The fix round preserves the planned sequential save and publish lifecycle while correcting the review findings:

- `saveRecipeEdits` now returns the last owner-authenticated PATCH/PUT response instead of calling public `GET /recipes/:id`, so draft save and draft publish do not fail during refresh. The editor still invalidates owner/detail queries after success and only navigates after the save/publish sequence completes.
- Owner recipe responses normalize `quantity_text`, `original_text`, and `unit_text` into the editor's `quantityText`, `originalText`, and `unit` fields. Untouched structured ingredients therefore remain intact when an edit is saved.
- Backend PATCH, structured ingredient/nutrition/tag replacements, and metadata replacement reject archived recipes with `RECIPE_ARCHIVED_READ_ONLY`. The owner-authenticated restore operation remains allowed and returns the recipe as a draft.
- `RecipeEditSaveError` preserves API `code`, HTTP status, response details, and the original error when those details are available.
- Focused coverage now includes draft save without publish, draft save-then-publish ordering, owner/detail invalidation signaling, parent navigation, archived restore, archived mutation rejection, snake_case ingredient hydration, validation-detail preservation, and double-submit prevention.

## Fix round verification

Commands run from `src/frontend`:

```powershell
& .\node_modules\.bin\vitest.cmd run features/recipes/recipeEditorApi.test.ts features/recipes/RecipeEditor.test.jsx features/recipes/RecipeEditor.accessibility.test.jsx features/recipes/EditRecipe.test.jsx
```

Result: PASS, 4 files and 19 tests.

```powershell
& .\node_modules\.bin\eslint.cmd features/recipes/recipeEditorApi.ts features/recipes/recipeEditorApi.test.ts features/recipes/editRecipeApi.ts features/recipes/editRecipeApi.test.ts features/recipes/RecipeEditor.jsx features/recipes/RecipeEditor.test.jsx features/recipes/EditRecipe.jsx features/recipes/EditRecipe.test.jsx
& .\node_modules\.bin\tsc.cmd --noEmit
& .\node_modules\.bin\vite.cmd build
```

Result: PASS. The production build emitted existing Vite config and large-chunk warnings only.

Commands run from `src/backend`:

```powershell
& .\node_modules\.bin\jest.cmd --runInBand src/modules/recipes/recipes.service.spec.ts src/modules/recipe-metadata/recipe-metadata.service.spec.ts
& .\node_modules\.bin\jest.cmd --runInBand src/modules/recipes/recipes.repository.spec.ts src/modules/recipe-metadata/recipe-metadata.repository.spec.ts
& .\node_modules\.bin\jest.cmd --runInBand
& .\node_modules\.bin\tsc.cmd -p tsconfig.json --noEmit
& .\node_modules\.bin\tsc.cmd -p tsconfig.build.json
& .\node_modules\.bin\prisma.cmd validate --config prisma.config.ts
```

Results: focused service suites PASS (2 suites, 20 tests); focused repository suites PASS (2 suites, 16 tests); full backend Jest PASS (31 suites, 138 tests); typecheck, build, and Prisma validation PASS.

The first sandboxed frontend Vitest attempt was blocked by the environment: Vite could not load the installed `@tailwindcss/oxide-win32-x64-msvc` native binding and then reported `spawn EPERM`. The same focused command passed when rerun with elevated process/file access. No dependency or environment files were changed.

The fix commit SHA is included in the final handoff for this report.
