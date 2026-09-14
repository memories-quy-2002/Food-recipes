# Shopping List Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add an authenticated, mobile-friendly shopping list workflow that supports manual grocery items, item state changes, source recipe attribution, and importing free-text ingredients from a recipe.

**Architecture:** Keep all shopping-list server state in TanStack Query and keep inline edit/form state local to the page. Reuse the existing Axios client, protected-route pattern, `PageHelmet`, toast provider, React Router, and warm Food Recipes visual tokens. Use the existing backend planning module; do not add duplicate endpoints or database tables.

**Tech Stack:** React 19, TypeScript/TSX, React Router, TanStack Query 5, Axios, SCSS, Vitest, React Testing Library, Playwright.

## Global Constraints

- Preserve the existing feature-oriented frontend structure.
- Keep server state in TanStack Query and local UI/form state local.
- Preserve ingredient strings exactly; never merge free-text quantities automatically.
- Every authenticated shopping-list request must use the existing owner-scoped API.
- Interactive controls need semantic names, visible `:focus-visible`, reduced-motion behavior, and practical 44px touch targets.
- Support loading, empty, error, retry, keyboard, mobile, and desktop states.
- Do not stage or modify the user-owned `AGENTS.md` or `food-recipes-ai-agent-implementation-prompt.md` changes.

---

### Task 1: Shopping-list API and query foundation

**Files:**

- Modify: `src/frontend/shared/api/routes.js`
- Create: `src/frontend/features/shopping/api/shoppingApi.ts`
- Create: `src/frontend/features/shopping/api/shoppingQueries.ts`
- Create: `src/frontend/features/shopping/api/shoppingApi.test.ts`

**Interfaces:**

- `ShoppingListItem` contains `item_id`, `label`, `quantity`, `source_recipe_id`, `source_recipe_name`, and `checked`.
- `listShoppingItems(signal?)` returns `{ items: ShoppingListItem[] }`.
- `addShoppingItem(input)`, `updateShoppingItem(itemId, input)`, `deleteShoppingItem(itemId)`, `clearCompletedShoppingItems()`, and `addRecipeIngredients(recipeId)` use the existing `/users/me/shopping-list` routes.
- Query mutations invalidate `shoppingQueryKeys.all` after success.

- [x] Write failing API contract tests for list, manual add, patch checked state, delete, clear completed, and recipe import.
- [x] Run the focused Vitest file and confirm it fails because the module/routes do not exist.
- [x] Add the route constants and typed Axios functions without introducing `any`, `unknown as`, or a duplicate API client.
- [x] Add the query and mutation hooks with cancellation for list requests and cache invalidation after successful mutations.
- [x] Run the focused Vitest file and confirm all API contract tests pass.

### Task 2: Protected Shopping List page

**Files:**

- Create: `src/frontend/features/shopping/ShoppingListPage.tsx`
- Create: `src/frontend/features/shopping/ShoppingList.scss`
- Create: `src/frontend/features/shopping/ShoppingListPage.test.tsx`
- Modify: `src/frontend/app/AppRoutes.jsx`
- Modify: `src/frontend/shared/layout/navigation.js`

**Interfaces:**

- `ShoppingListPage` renders a protected `/shopping-list` route.
- The page provides a labelled manual-add form with `label` and optional `quantity`.
- Items are grouped into “To buy” and “Completed”; each row supports check/uncheck, edit, save/cancel, and delete.
- The page offers “Clear completed” only when completed items exist and keeps the action disabled while pending.

- [x] Write failing page tests for loading, empty state, manual-add form, completed grouping, edit/cancel, check, delete, clear completed, and retryable API error state.
- [x] Run the focused page tests and confirm they fail because the route/page does not exist.
- [x] Implement the page with TanStack Query hooks, local draft state, optimistic-feeling disabled/busy controls, inline validation, and non-raw error copy.
- [x] Add feature-scoped SCSS: editorial grocery-list hierarchy, mobile-first stacking, desktop two-column summary/list layout, 44px controls, visible focus, 150–300ms transitions, and reduced motion.
- [x] Register `/shopping-list` inside `ProtectedRoute` and expose `Shopping` only for authenticated navigation.
- [x] Run the focused page tests and confirm they pass.

### Task 3: Recipe ingredient import

**Files:**

- Modify: `src/frontend/features/recipes/Recipe.jsx`
- Modify: `src/frontend/features/recipes/RecipeContainerSummary.jsx`
- Modify: `src/frontend/features/recipes/Recipe.scss`
- Create: `src/frontend/features/recipes/RecipeContainerSummary.shopping.test.jsx`

**Interfaces:**

- Recipe detail exposes an optional `Add ingredients to shopping list` action alongside Start cooking and Save.
- Guests are sent to the existing account flow; authenticated users call `addRecipeIngredients(recipe.recipe_id)`.
- Success reports how many ingredient lines were added and offers a direct `/shopping-list` link through the existing toast/action language.
- The import preserves every backend ingredient string as a separate shopping-list item; no quantity parsing or merging is performed in the frontend.

- [x] Write a failing component/integration test for the action label, authenticated mutation callback, loading state, and success feedback.
- [x] Run the focused test and verify the desired behavior fails before wiring the action.
- [x] Pass the recipe action callback from `Recipe.jsx` into `RecipeContainerSummary` and use the shopping mutation hook.
- [x] Style the action group so it remains readable and tappable on small screens.
- [x] Run recipe-focused tests and confirm the existing Start cooking/Save behavior remains unchanged.

### Task 4: User journey and responsive verification

**Files:**

- Create: `src/frontend/e2e/shopping-list-journey.spec.js`
- Modify: `src/frontend/e2e/planning-journey.spec.js` only if a shared fixture regression is found.

- [x] Add a mocked authenticated journey: open Shopping, add manual item, check it, edit it, import recipe ingredients, and clear completed items.
- [x] Cover source recipe attribution and exact free-text ingredient preservation.
- [x] Verify 375px, 768px, 1024px, and 1440px layouts have no document overflow and controls remain at least 44px.
- [x] Run focused Vitest, frontend lint/typecheck/build, relevant Playwright journeys, backend typecheck/tests/build, and Prisma validation.
- [x] Run `git diff --check`, review the diff, stage only Phase 2 files plus this plan, and commit with `feat(shopping): add authenticated shopping list`.
