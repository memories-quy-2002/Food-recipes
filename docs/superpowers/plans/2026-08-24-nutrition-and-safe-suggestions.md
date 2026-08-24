# Phase 15–16 Nutrition and Safe Suggestions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add author-entered nutrition/allergen metadata and a safe, read-only ingredient suggestion workflow without guessed health data, automatic recipe mutations, or unnecessary provider infrastructure.

**Architecture:** Recipe metadata is a separate owned resource with explicit provenance (`provided_by_author`, `estimated`, or `verified_external`). Public recipe detail includes metadata only when supplied. Suggestions are served by a small catalog-backed service with intent-specific validation; the response identifies its source and never writes recipes, collections, plans, or shopping lists.

**Tech Stack:** NestJS, Prisma SQL migrations, class-validator, React, TanStack Query, Vitest, Playwright.

## Global Constraints

- Never infer nutrition or allergens from ingredient text.
- Every displayed metadata block shows its provenance and an estimated-data safety notice.
- AI/suggestion output is advisory only and cannot mutate saved recipes or bypass DTO validation.
- Keep ownership checks server-side and follow existing feature-oriented module boundaries.
- No new dependency or external API key is required for the first safe catalog-backed provider.

---

### Task 1: Persist and validate recipe metadata

**Files:**
- Modify: `src/backend/prisma/schema.prisma`
- Create: `src/backend/prisma/migrations/<timestamp>_add_recipe_metadata/migration.sql`
- Create: `src/backend/src/modules/recipe-metadata/dto/recipe-metadata.dto.ts`
- Create: `src/backend/src/modules/recipe-metadata/recipe-metadata.repository.ts`
- Create: `src/backend/src/modules/recipe-metadata/recipe-metadata.service.ts`
- Create: `src/backend/src/modules/recipe-metadata/recipe-metadata.module.ts`
- Create: `src/backend/src/modules/recipe-metadata/recipe-metadata.service.spec.ts`
- Create: `src/backend/src/modules/recipe-metadata/recipe-metadata.repository.spec.ts`

**Behavior:** Store one nutrition record per recipe and zero or more explicitly declared allergen records. Enforce non-negative values, supported source/allergen names, unique recipe/allergen pairs, and author ownership. Replace metadata atomically and return normalized snake_case records.

- [ ] Write failing DTO/service/repository tests for accepted provenance, rejected guessed/unknown values, owner-only replacement, and empty metadata.
- [ ] Run the focused Jest tests and confirm they fail for the missing module/behavior.
- [ ] Add Prisma models, SQL constraints/indexes, DTOs, repository, service, and module.
- [ ] Run focused tests, Prisma validate/generate, and deploy the local migration.

### Task 2: Expose metadata through the recipe API and author form

**Files:**
- Modify: `src/backend/src/app.module.ts`
- Modify: `src/backend/src/modules/recipes/recipes.module.ts`
- Modify: `src/backend/src/modules/recipes/recipes.service.ts`
- Modify: `src/backend/src/modules/recipes/recipes.repository.ts`
- Modify: `src/backend/src/common/swagger/response.schemas.ts`
- Modify: `src/frontend/shared/api/contracts.ts`
- Modify: `src/frontend/shared/api/mutations.js`
- Modify: `src/frontend/features/recipes/recipeForm.schema.ts`
- Modify: `src/frontend/features/recipes/AddRecipe.jsx`
- Modify: `src/frontend/features/recipes/AddRecipe.scss`
- Create: `src/frontend/features/recipes/RecipeMetadataPanel.jsx`
- Create: `src/frontend/features/recipes/RecipeMetadataPanel.scss`
- Create: `src/frontend/features/recipes/RecipeMetadataPanel.test.jsx`

**Behavior:** `GET /api/v1/recipes/:id/metadata` is public; `PUT /api/v1/recipes/:id/metadata` is owner-only. Recipe detail renders supplied metadata and provenance, never an inferred “free from” claim. The author form allows optional manual nutrition and declared allergen entry and sends the same validated contract at recipe creation.

- [ ] Write failing frontend tests for provenance rendering, estimated warning, and no-metadata empty state.
- [ ] Run those tests to confirm the expected failure.
- [ ] Add API contract/types, integrate metadata into recipe detail, and add optional author form fields.
- [ ] Run focused frontend tests and lint/typecheck.

### Task 3: Add safe catalog-backed suggestions

**Files:**
- Create: `src/backend/src/modules/suggestions/dto/create-suggestion.dto.ts`
- Create: `src/backend/src/modules/suggestions/suggestions.repository.ts`
- Create: `src/backend/src/modules/suggestions/suggestions.service.ts`
- Create: `src/backend/src/modules/suggestions/suggestions.controller.ts`
- Create: `src/backend/src/modules/suggestions/suggestions.module.ts`
- Create: `src/backend/src/modules/suggestions/suggestions.service.spec.ts`
- Create: `src/backend/src/modules/suggestions/suggestions.controller.spec.ts`
- Modify: `src/backend/src/app.module.ts`

**Behavior:** `POST /api/v1/suggestions` accepts one of `ingredient_match`, `personalized`, `meal_plan`, or `substitution`. It validates bounded inputs, searches existing catalog/pantry/ratings/meal-plan data, returns recipe/ingredient suggestions plus `source: catalog_rules`, and requires authentication for personalized/meal-plan intents. It never writes data and returns a clear empty result when evidence is insufficient.

- [ ] Write failing service/controller tests for all intents, auth requirements, bounded input, no-match results, and proof that no write repository method is called.
- [ ] Run focused backend tests and confirm they fail.
- [ ] Implement read-only repository queries, ranking, service validation, controller, and module.
- [ ] Run focused tests and backend typecheck/build.

### Task 4: Add the suggestion UI without implying medical or autonomous behavior

**Files:**
- Modify: `src/frontend/shared/api/routes.js`
- Create: `src/frontend/features/suggestions/api/suggestionsApi.ts`
- Create: `src/frontend/features/suggestions/api/suggestionsQueries.ts`
- Create: `src/frontend/features/suggestions/SuggestionPanel.jsx`
- Create: `src/frontend/features/suggestions/SuggestionPanel.scss`
- Create: `src/frontend/features/suggestions/SuggestionPanel.test.jsx`
- Modify: `src/frontend/features/recipes/Recipe.jsx`
- Modify: `src/frontend/features/home/Home.jsx`

**Behavior:** Provide an ingredient-input suggestion panel and a recipe-detail substitution panel. Results are labeled “Suggestions”, show the catalog source, support loading/empty/error states, have accessible labels/live regions, and only navigate to recipes; they do not auto-save, edit, plan, or add shopping items.

- [ ] Write failing component/API tests for submit, loading, error, empty, accessible status, and non-mutating result links.
- [ ] Run focused tests to confirm the expected failure.
- [ ] Implement the API hooks and responsive UI using existing tokens and `focus-visible` styles.
- [ ] Run focused tests, full frontend checks, and browser checks at 375/768/1280px.

### Task 5: Full verification and handoff

- [ ] Run backend tests, typecheck, build, Prisma validate, and migration status.
- [ ] Run frontend tests, lint, typecheck, build, and Playwright journeys/accessibility.
- [ ] Run agent-browser page-load/console/blank checks and capture screenshots for Home, Recipe detail, metadata, and Suggestions.
- [ ] Review CSS against web-design-guidelines and ui-ux-pro-max, then inspect screenshots with product-design audit criteria.
- [ ] Run `git diff --check`, inspect branch/worktree, and update the implementation plan with evidence.
