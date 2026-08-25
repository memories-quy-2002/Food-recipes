# Kitchen Loop Implementation Plan
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan.

**Goal:** Connect recipe discovery, planning, shopping, pantry availability, cooking completion, history, and personalized suggestions through owned backend data and responsive frontend handoffs.

**Architecture:** Keep the existing independent `src/backend` and `src/frontend` packages. Add a small protected cooking-history module backed by PostgreSQL. Keep cooking-mode UI focused by passing a completion callback from the recipe route. Reuse existing planning, pantry, shopping, toast, suggestion, and UI primitives rather than introducing a new state layer.

**Tech Stack:** NestJS, Prisma migrations, PostgreSQL, React, TypeScript/JSX, React Router, TanStack Query, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-25-kitchen-loop-design.md`

## Global Constraints

- Run backend commands from `src/backend` and frontend commands from `src/frontend`; never run pnpm from the repository root.
- Preserve unrelated user changes and existing `.superpowers/sdd` artifacts.
- Keep all ownership checks server-side and validate the optional meal-plan item against both user and recipe.
- Use `apply_patch` for source edits and do not reset or delete unrelated files.
- Keep new controls keyboard accessible, responsive, and compatible with the existing design tokens and toast system.

## Task 1: Add the protected cooking-history backend module

**Files:**

- Modify `src/backend/prisma/schema.prisma`
- Create `src/backend/prisma/migrations/20260825110000_add_cooking_history/migration.sql`
- Create `src/backend/src/modules/cooking-history/cooking-history.module.ts`
- Create `src/backend/src/modules/cooking-history/cooking-history.controller.ts`
- Create `src/backend/src/modules/cooking-history/cooking-history.service.ts`
- Create `src/backend/src/modules/cooking-history/cooking-history.repository.ts`
- Create `src/backend/src/modules/cooking-history/dto/create-cooking-history.dto.ts`
- Modify `src/backend/src/app.module.ts`
- Modify the relevant response DTO definitions in `src/backend/src/common/swagger/response.schemas.ts`
- Add focused specs beside the module for service/repository/controller behavior

**Implementation:**

1. Model the table and migration with foreign keys to `accounts`, `recipes`, and optional `meal_plan_items`; use cascade cleanup and indexes for `(user_id, completed_at)` and `(user_id, recipe_id)`.
2. Expose `GET` and `POST` under `users/me/cooking-history` with `JwtAuthGuard`, Swagger decorators, and `{ items }` / `{ item }` response envelopes.
3. Validate positive recipe/meal-plan ids and servings plus ISO timestamps when supplied. Default `startedAt` to the current time and `completedAt` to the current time; reject a completion earlier than its start.
4. In the service, verify recipe existence and optional meal-plan ownership/recipe match before inserting. Map database columns to the project’s snake_case API contract.
5. Test success, recipe-not-found, mismatched plan item, cross-user access, and empty history behavior using repository ports/mocks consistent with existing modules.

**Verification:** From `src/backend`, run `corepack pnpm@11.18.0 prisma:validate`, the focused Jest specs, then `corepack pnpm@11.18.0 check`.

## Task 2: Add frontend history queries, page, route, and navigation

**Files:**

- Modify `src/frontend/shared/api/routes.js`
- Create `src/frontend/features/history/api/historyApi.ts`
- Create `src/frontend/features/history/api/historyQueries.ts`
- Create `src/frontend/features/history/HistoryPage.tsx`
- Modify `src/frontend/app/AppRoutes.jsx`
- Modify `src/frontend/shared/layout/navigation.js`
- Modify the matching footer/navigation test files
- Add `src/frontend/features/history/HistoryPage.test.tsx` or the project’s nearest supported test format

**Implementation:**

1. Add typed list/create API functions and TanStack Query hooks using the existing API client and auth token boundary.
2. Render a protected, mobile-first history page with loading, empty, error, and populated states. Use `Intl.DateTimeFormat` for completion dates and links for recipe review/replay.
3. Mount `SuggestionPanel` in personalized mode below history, with a clear “suggestions are catalog-backed” explanation and links to planning/shopping.
4. Add History only to authenticated primary navigation; retain active-route semantics and mobile-menu behavior.
5. Add tests for query payloads, empty/error/populated rendering, replay links, and navigation active state.

**Verification:** From `src/frontend`, run the focused history/navigation tests and `corepack pnpm@11.18.0 check`.

## Task 3: Persist completion from cooking mode and preserve planned context

**Files:**

- Modify `src/frontend/features/recipes/cooking/CookingMode.tsx`
- Modify `src/frontend/features/recipes/cooking/CookingMode.guided-flow.test.jsx`
- Modify `src/frontend/features/recipes/Recipe.jsx`
- Add or modify the history mutation hook tests
- Modify `src/frontend/e2e/planning-journey.spec.js` or add a focused kitchen-loop journey fixture

**Implementation:**

1. Add an optional async `onComplete` callback to `CookingMode`; guard it with a pending state and only enable Finish on the final step.
2. Show “Saving cooking history…” while the callback is pending, keep focus in the cooking surface, and show a local retryable alert if persistence fails.
3. In `Recipe.jsx`, pass recipe id, servings, and optional plan item id to the history mutation. Keep return paths constrained to same-origin internal routes.
4. After success, preserve the planned completion panel and Back to plan action; for an unplanned cook, return to recipe detail after persistence.
5. Test successful completion, pending/duplicate-click protection, failure/retry affordance, and the existing keyboard guided flow.

**Verification:** Run focused cooking tests, then the kitchen-loop Playwright journey with network stubs or the local backend depending on available authentication state.

## Task 4: Close the planning → shopping → pantry handoffs

**Files:**

- Modify `src/frontend/features/planning/PlanningPage.tsx`
- Modify `src/frontend/features/shopping/ShoppingListPage.tsx`
- Modify `src/frontend/features/pantry/PantryPage.tsx` only if the contextual copy/CTA needs alignment
- Add a small pure helper beside shopping API/types for pantry matching and test it
- Modify the corresponding page tests

**Implementation:**

1. Add a prominent but secondary “Build shopping list” link to planning.
2. Read the authenticated pantry query on Shopping List and derive case-insensitive label matches from items with `have === true`.
3. Render an accessible “In pantry” status on matching unchecked items without changing the shopping checkbox state; keep source-recipe links and edit/delete controls intact.
4. Use ToastProvider for successful import/add/toggle/delete/clear actions where it improves feedback, while retaining inline errors for recovery context.
5. Keep manual entry, planned import, and pantry links usable at narrow widths with visible focus states and no horizontal overflow.

**Verification:** Run focused planning/shopping/pantry tests, build the frontend, and check the three pages at desktop and mobile viewports in Browser/Playwright.

## Task 5: Run the full kitchen-loop UX and security verification

**Files:**

- Modify/add `src/frontend/e2e/kitchen-loop.spec.js`
- Add backend API/E2E coverage under `src/backend/test/` if the existing harness supports the new endpoints
- Update docs only if command/route contracts changed

**Implementation:**

1. Exercise discovery → planning → import → pantry status → cooking → history → suggestions with deterministic API fixtures.
2. Run the same journey at the configured desktop viewport and a narrow mobile viewport; assert no horizontal overflow, visible primary actions, and accessible labels/statuses.
3. Verify unauthorized history requests are rejected and cross-user ids cannot be attached through the API.
4. Use the Browser plugin to inspect the live app and take screenshots of planning, shopping list, pantry, cooking completion, and history. Use Playwright CLI for repeatable assertions and artifact output under `src/frontend/output/playwright`.
5. Review changed UI files against Web Interface Guidelines and the UI/UX Pro Max priorities: focus, touch targets, live feedback, responsive layout, and explicit recovery paths.

**Verification:** Run backend `check`, `build`, `prisma:validate`, and relevant API tests; frontend `check`, `build`, and `test:e2e:ci`; inspect Browser screenshots and report any environment-limited checks honestly.
