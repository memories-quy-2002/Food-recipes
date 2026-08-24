# Product Completion P1 Implementation Plan

> **For agentic workers:** Use inline execution with the TDD workflow and review each task before starting the next.

**Goal:** Complete the remaining P1 workflows: scalable recipe search, private saved collections, private recipe notes, manual cooking timers, and recently viewed recipes.

**Architecture:** Reuse the existing Axios client, TanStack Query hooks, protected-route pattern, Bootstrap/SCSS feature boundaries, and NestJS repository/service/controller layers. Keep the existing wishlist as the default “All saved” collection, add collection persistence beside it without duplicating recipe data, keep notes server-owned and private, and keep timers/recent history client-local.

**Tech Stack:** React/JSX, TypeScript hooks where new API contracts are added, React Router, TanStack Query, Axios, NestJS, Prisma/PostgreSQL, Vitest/Testing Library, Playwright, SCSS.

## Global Constraints

- Do not add a dependency; use the existing browser APIs and query client.
- Keep all user-owned reads and mutations scoped by the authenticated user on the backend.
- Preserve `/recipe?id=42`, `/saved`, `/wishlist`, and existing wishlist behavior.
- Preserve the warm food-oriented visual language and use mobile-first responsive styles.
- Use semantic controls, visible focus, keyboard support, reduced motion, and minimum 44px touch targets.
- Every new production function gets a focused test; every new backend endpoint gets service and controller/API coverage appropriate to the existing test setup.
- Do not add nutrition/allergen estimates or AI behavior without a trustworthy data source and a separate approved product decision.

### Task 1: Server-backed Home search suggestions

**Files:**
- Modify: `src/frontend/features/home/Home.jsx`, `src/frontend/features/home/main/HomeSearchBar.jsx`
- Create: `src/frontend/features/home/main/api/useHomeSearchQuery.ts`, `src/frontend/features/home/main/api/useHomeSearchQuery.test.ts`
- Modify: `src/frontend/shared/api/routes.js`
- Test: `src/frontend/features/home/main/HomeSearchBar.server-search.test.jsx`
- Test: `src/frontend/e2e/current-user-journeys.spec.js` or a focused new Playwright journey

Implement a 200–300ms debounced query with a minimum two-character term, stale-result protection through TanStack Query, a maximum of eight suggestions, a “View all results” link to `/food?q=...`, and the existing ArrowDown/ArrowUp/Enter/Escape behavior. Home must no longer filter a complete recipe collection to produce suggestions when a term is active.

### Task 2: Saved collection API and private ownership

**Files:**
- Modify: `src/backend/src/modules/collections/collections.repository.ts`, `collections.service.ts`, `collections.controller.ts`, `collections.module.ts`
- Create: `src/backend/src/modules/collections/dto/collection-recipe-query.dto.ts` if pagination is needed
- Test: `src/backend/src/modules/collections/collections.repository.spec.ts`, `collections.service.spec.ts`, `collections.controller.spec.ts`
- Modify: `src/frontend/shared/api/routes.js`
- Create: `src/frontend/features/saved/api/collectionsApi.ts`, `collectionsQueries.ts`, and focused tests

Add an owner-scoped `GET /api/v1/users/me/collections/:collectionId/recipes` endpoint returning recipe cards, keep duplicate membership as a conflict, validate recipe existence, and expose typed query/mutation functions for list/create/rename/delete/add/remove. Do not expose another user’s collection or recipe membership.

### Task 3: Saved collections UI

**Files:**
- Modify: `src/frontend/features/wishlist/Wishlist.jsx`, `src/frontend/features/wishlist/Wishlist.scss`, `src/frontend/app/AppRoutes.jsx`
- Create: `src/frontend/features/saved/collections/SavedCollections.jsx`, `CollectionDialog.jsx`, `CollectionRecipeDialog.jsx`, and focused tests
- Replace: `src/frontend/features/saved/collections/SavedCollectionsNotice.jsx` and unsupported contract tests with real capability tests
- Modify: `src/frontend/features/recipes/Recipe.jsx`, `RecipeContainerSummary.jsx`, `Recipe.scss`
- Create/modify: saved-collection Playwright journey

Keep All saved backed by the wishlist endpoint. Add collection tabs, create/rename/delete controls, recipe membership actions, loading/empty/error states, and a “Save to…” dialog from recipe detail. All destructive actions require an explicit confirmation. Keep `/wishlist` as a compatibility alias for `/saved`.

### Task 4: Private recipe notes

**Files:**
- Modify: `src/backend/prisma/schema.prisma`
- Create: additive Prisma migration under `src/backend/prisma/migrations/`, `src/backend/src/modules/notes/` module, DTOs, repository, service, controller, and tests
- Modify: `src/backend/src/app.module.ts`, Swagger response schemas when needed
- Create: `src/frontend/features/recipes/notes/PrivateRecipeNote.jsx`, API/query files, component tests
- Modify: `src/frontend/features/recipes/Recipe.jsx`, `RecipeContent.jsx`, `Recipe.scss`

Create one private note document per `(userId, recipeId)` with bounded text, GET/PATCH/DELETE semantics, owner checks, validation, non-raw error copy, and an explicit save/delete UI. Guests see a sign-in path; notes never appear in community reviews or public recipe responses.

### Task 5: Manual Cooking Mode timers

**Files:**
- Create: `src/frontend/features/recipes/cooking/useCookingTimer.js`, `CookingTimer.jsx`, focused tests
- Modify: `src/frontend/features/recipes/cooking/CookingMode.tsx`, `CookingMode.scss`
- Modify: `src/frontend/e2e/recipe-planning-continuity.spec.js` with a timer behavior check

Provide a manual timer with minutes/seconds input and Start/Pause/Resume/Reset. Use monotonic elapsed-time calculation rather than decrementing state every second, clean intervals on unmount, support multiple timers only if the focused component remains simple, and never depend on notification permission. Respect reduced motion and announce completion with accessible status text.

### Task 6: Recently viewed recipes

**Files:**
- Create: `src/frontend/features/recipes/recentlyViewed.js`, tests, and `RecentlyViewedRecipes.jsx`
- Modify: `src/frontend/features/recipes/Recipe.jsx`, `src/frontend/features/home/Home.jsx`, and relevant SCSS

Store at most 20 records as `{ recipeId: number, viewedAt: string }` in localStorage, deduplicate by recipe ID, tolerate malformed storage, and render a compact Home section only when there is history. Do not make a network request for history and do not store full recipe objects.

### Task 7: P1 verification and commits

Run focused RED/GREEN tests per task, frontend lint/typecheck/unit/build, backend typecheck/build/tests/prisma validation, and Playwright coverage for search, collections, notes, timers, and recently viewed. Run `git diff --check`, inspect changed files, and commit each coherent feature with Conventional Commits.

## Deferred P2/P3 gates

After P1 is green, write and execute a separate P2 plan for additive structured ingredients, serving scaling, structured grocery consolidation, and the boolean pantry. Do not start those migrations while P1 is unstable. Nutrition/allergens and AI remain explicitly deferred until their data-source/product gates are satisfied.
