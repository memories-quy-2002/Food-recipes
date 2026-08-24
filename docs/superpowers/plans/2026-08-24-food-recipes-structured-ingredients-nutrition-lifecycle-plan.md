# Structured Ingredients, Nutrition, and Recipe Lifecycle Implementation Plan

> Execute this plan task-by-task. Keep the current dirty worktree intact and do not commit or push.

## Goal

Implement the approved additive recipe domain extension: ordered structured ingredients, manual nutrition and dietary metadata, and Draft → Published → Archived lifecycle, while preserving legacy recipe and planning contracts.

## Global constraints

- Work only in the files listed by each task unless a compile error requires a directly related file.
- Preserve `ingredients: string[]` and `instructions: string[]` in existing API responses.
- Public recipe reads must filter to `published`; owner reads must support all lifecycle statuses.
- Use the existing raw-SQL Prisma repository style and existing auth/ownership guards.
- Do not run `prisma migrate reset`; use an additive migration and deploy/validate it.
- Do not add a nutrition provider or infer nutrition values.
- Do not commit or push.

## Task 1 — Additive database model and backfill

Files:

- `src/backend/prisma/schema.prisma`
- `src/backend/prisma/migrations/20260824090000_add_recipe_structure_nutrition_lifecycle/migration.sql`

Work:

1. Add recipe lifecycle columns (`status`, `published_at`, `archived_at`, `updated_at`) with a check constraint and a default of `published` for compatibility.
2. Add `recipe_ingredients`, `recipe_nutrition`, `recipe_dietary_tags`, and `recipe_allergen_tags` tables with ownership through `recipe_id`, ordering/indexes, uniqueness, and safe numeric checks.
3. Backfill one ordered structured row for every legacy ingredient array entry without guessing quantities or units.
4. Add Prisma models matching the tables and run Prisma formatting/validation.

Verification: `corepack pnpm@11.18.0 exec prisma validate --config prisma.config.ts` from `src/backend`.

## Task 2 — Backend DTOs, repository, service, and controllers

Files:

- `src/backend/src/modules/recipes/dto/*`
- `src/backend/src/modules/recipes/recipes.repository.ts`
- `src/backend/src/modules/recipes/recipes.service.ts`
- `src/backend/src/modules/recipes/recipes.controller.ts`
- `src/backend/src/modules/recipes/user-recipes.controller.ts`
- `src/backend/src/common/swagger/response.schemas.ts`
- focused recipe tests under `src/backend/src/modules/recipes` and Swagger tests if schemas change

Work:

1. Extend the internal recipe record with lifecycle and structured metadata while preserving legacy fields.
2. Filter public list/detail SQL to `status = 'published'`.
3. Add owner draft listing/filtering and explicit draft creation.
4. Add replace operations for structured ingredients, manual nutrition, dietary tags, and allergen tags. Validate array limits, non-empty names, numeric ranges, and ownership.
5. Add publish/archive/restore transitions with clear `BadRequestException`/`NotFoundException` behavior and publish validation.
6. Keep compatibility `POST /recipes`, `PATCH /recipes/:id`, and `DELETE /recipes/:id` behavior intact.
7. Document new DTOs and response metadata in Swagger without making legacy fields newly required.

Verification: focused Jest recipe tests, `corepack pnpm@11.18.0 run typecheck`, `corepack pnpm@11.18.0 run build`, and `corepack pnpm@11.18.0 run prisma:validate` from `src/backend`.

## Task 3 — Frontend contract and editing experience

Files:

- `src/frontend/shared/api/routes.js`
- `src/frontend/shared/api/contracts.ts`
- `src/frontend/features/recipes/api/useRecipeQueries.ts`
- `src/frontend/features/recipes/recipeForm.schema.ts`
- `src/frontend/features/recipes/recipeDraftStorage.js`
- `src/frontend/features/recipes/AddRecipe.jsx`
- `src/frontend/features/recipes/Recipe.jsx`
- `src/frontend/features/recipes/RecipeIngredientList.jsx`
- related focused frontend tests

Work:

1. Add typed route/payload helpers for draft creation, structured ingredient replacement, nutrition/tag replacement, and lifecycle transitions.
2. Extend draft serialization/versioning with structured ingredients, manual nutrition, dietary tags, and lifecycle/server identifiers while accepting version-1 drafts.
3. Make `Save draft` call the authenticated server draft endpoint, retaining local storage fallback; make `Publish` save the aggregate and call `/publish`.
4. Add repeatable structured ingredient controls, manual per-serving nutrition controls, dietary/allergen chips, and validation messages without breaking existing draft tests.
5. Render structured metadata on recipe detail with legacy fallback.

Verification: frontend focused tests first, then `corepack pnpm@11.18.0 run check` and `corepack pnpm@11.18.0 run build` from `src/frontend`.

## Task 4 — Owner lifecycle UI and integration verification

Files:

- `src/frontend/features/profile/PersonalRecipes.jsx`
- `src/frontend/features/profile/Profile.jsx` only if integration requires a prop/API adjustment
- affected frontend tests and documentation only if required to describe the final contract

Work:

1. Add status tabs or filters, status badges, and owner actions for publish, archive, restore, view, and delete.
2. Refresh the owner list after every transition and show actionable errors.
3. Keep existing empty/loading/error states and responsive layout contracts.
4. Run backend and frontend gates, inspect the diff for unrelated changes, and perform a browser smoke on Add Recipe, Profile → Personal Recipes, public catalog, and Recipe detail.

Verification: targeted owner UI tests, full backend check/build/test suite as practical, frontend `check` and `build`, `git diff --check`, and browser smoke with the running Vite app.

## Completion checklist

- [ ] Additive migration and Prisma schema validate.
- [ ] Public reads exclude draft/archived recipes.
- [ ] Owner lifecycle and structured metadata endpoints enforce ownership.
- [ ] Legacy ingredient arrays still work for planning and existing clients.
- [ ] Frontend can save draft, publish, archive, and restore.
- [ ] Manual nutrition and dietary metadata render on detail.
- [ ] Relevant backend/frontend checks pass.
- [ ] No unrelated dirty files were reverted or overwritten.
