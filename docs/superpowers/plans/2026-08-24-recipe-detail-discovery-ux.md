# Recipe Detail and Mobile Discovery UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make recipe detail easier to scan and make `/food` comfortable, URL-driven, and touch-friendly on mobile.

**Architecture:** Preserve the current Recipe and Food routes, Axios contract, and URL parser. Phase 4 reorders the existing RecipeDescription blocks and adds narrowly scoped layout classes. Phase 5 keeps the desktop FoodMenuBar as the source of filter controls, renders a mobile-only FilterSheet with the same callbacks, and derives active chips from the parsed URL state plus loaded labels.

**Tech Stack:** React 19, JSX, React Router, TanStack Query, SCSS, Vitest/Test Renderer, Playwright.

## Global Constraints

- Do not add backend routes, database fields, fake dietary/allergen filters, or new dependencies.
- Keep `q`, `categoryId`, `mealId`, `sort`, `page`, and `limit` URL-driven and shareable.
- Keep all interactive controls at least 44px high with visible focus and reduced-motion support.
- Preserve existing loading, error, empty, pagination, Save, Shopping, Planning, and Cooking behavior.
- Do not modify or stage user-owned `AGENTS.md` or `food-recipes-ai-agent-implementation-prompt.md`.

---

### Task 1: Phase 4 recipe detail hierarchy

**Files:**

- Modify: `src/frontend/features/recipes/content/RecipeDescription.jsx`
- Modify: `src/frontend/features/recipes/Recipe.scss`
- Test: `src/frontend/features/recipes/RecipeDescription.time.test.jsx`

**Interfaces:**

- Keep `getRecipeTimeSummary`, `normalizeRecipeTime`, `formatRecipeDuration`, and servings behavior unchanged.
- Render `.recipe__content__time` before `.recipe__content__desc` so practical decision facts precede the About copy.
- Add `.recipe__content__prose` to the About, Ingredients, and Instructions inner wrappers for a readable measure.

- [ ] **Step 1: Write the failing hierarchy tests**

  Render `RecipeDescription` and assert the first content row is `.recipe__content__time`, the About/Ingredients/Instructions wrappers have `recipe__content__prose`, and all four time facts remain present.

- [ ] **Step 2: Run the focused test to verify RED**

  ```powershell
  fnm exec --using v24.16.0 -- C:\Users\quy\AppData\Roaming\fnm\node-versions\v24.16.0\installation\npx.cmd --yes pnpm@11.18.0 exec vitest run features/recipes/RecipeDescription.time.test.jsx
  ```

  Expected: fail because the time row currently follows About and prose wrappers do not exist.

- [ ] **Step 3: Implement the minimal hierarchy and responsive styles**

  Move the existing time row above About, add the prose class to the three text wrappers, constrain it to `min(100%, 68ch)`, preserve overflow wrapping, and add mobile-safe action/content spacing without changing data behavior.

- [ ] **Step 4: Run the focused recipe tests to verify GREEN**

  Run the same command and the existing Recipe summary/cooking tests. Expect all to pass.

---

### Task 2: Phase 5 mobile filter sheet contract

**Files:**

- Create: `src/frontend/features/food/FilterSheet.jsx`
- Create: `src/frontend/features/food/FilterSheet.test.jsx`
- Modify: `src/frontend/features/food/Food.jsx`
- Modify: `src/frontend/features/food/Food.scss`
- Modify: `src/frontend/features/food/FoodMenuBar.jsx`

**Interfaces:**

- `FilterSheet` receives `{ open, queryState, categories, meals, onQueryStateChange, onClearFilters, onClose }`.
- It renders a semantic dialog with search, category, meal, Clear all, Cancel, and close actions.
- It reports filter changes through the existing `onQueryStateChange(changes)` callback; it does not own URL state.
- `Food` passes the same callbacks to desktop and mobile surfaces and derives `activeFilterCount` from `q`, `categoryId`, and `mealId`.

- [ ] **Step 1: Write failing FilterSheet tests**

  Assert the closed sheet renders nothing, open sheet has `role="dialog"`, Escape calls `onClose`, selecting a category calls `{ categoryId: "2", page: 1 }`, and Clear all calls `onClearFilters`.

- [ ] **Step 2: Run the focused test to verify RED**

  ```powershell
  fnm exec --using v24.16.0 -- C:\Users\quy\AppData\Roaming\fnm\node-versions\v24.16.0\installation\npx.cmd --yes pnpm@11.18.0 exec vitest run features/food/FilterSheet.test.jsx
  ```

  Expected: fail because `FilterSheet.jsx` does not exist.

- [ ] **Step 3: Implement the sheet and mobile trigger**

  Add a mobile-only `Filters (n)` button, render FilterSheet when open, label the dialog, wire Escape/Cancel/close, and reuse loaded categories/meals. Keep the existing desktop sidebar unchanged in behavior.

- [ ] **Step 4: Run FilterSheet and existing Food tests to verify GREEN**

  Run the focused sheet test plus `features/food/FoodContent.test.jsx` and `features/food/api/useRecipesQuery.test.ts`.

---

### Task 3: Phase 5 active chips and URL journey

**Files:**

- Create: `src/frontend/features/food/ActiveFilterChips.jsx`
- Create: `src/frontend/features/food/ActiveFilterChips.test.jsx`
- Modify: `src/frontend/features/food/Food.jsx`
- Modify: `src/frontend/features/food/Food.scss`
- Create: `src/frontend/e2e/recipe-discovery-mobile.spec.js`

**Interfaces:**

- `ActiveFilterChips` receives `{ queryState, categories, meals, onQueryStateChange, onClearFilters }`.
- It renders removable chips for q/categoryId/mealId and a Clear all control only when filters are active.
- Removing `q`, `categoryId`, or `mealId` calls `onQueryStateChange({ field: "", page: 1 })` with the correct field.

- [ ] **Step 1: Write failing chip tests**

  Render active search/category/meal state and assert human-readable labels, individual remove callbacks, and Clear all callback.

- [ ] **Step 2: Run the focused test to verify RED**

  ```powershell
  fnm exec --using v24.16.0 -- C:\Users\quy\AppData\Roaming\fnm\node-versions\v24.16.0\installation\npx.cmd --yes pnpm@11.18.0 exec vitest run features/food/ActiveFilterChips.test.jsx
  ```

- [ ] **Step 3: Implement chips and result-toolbar placement**

  Place chips below the mobile controls and above the result toolbar. Keep desktop chips useful but compact, use 44px remove buttons, and make the result count reflect the server pagination total.

- [ ] **Step 4: Add and run the Playwright journey**

  Stub `/recipes`, `/categories`, and `/meals`; at 375px open Filters, apply a category, verify query URL and chip, remove it, use browser back/forward, clear all, and assert no horizontal overflow. At 1024px verify the sidebar remains visible and the mobile trigger is hidden.

---

### Task 4: Full verification and commit

- [ ] Run focused tests, full frontend `test:ci`, lint, typecheck, build, and Phase 4/5 Playwright plus existing planning/shopping journeys.
- [ ] Run backend typecheck and `prisma validate`; backend source must remain unchanged.
- [ ] Run `git diff --check` and inspect staged files.
- [ ] Stage only Phase 4/5 docs, Recipe detail, Food filter components, tests, and E2E files.
- [ ] Commit with `feat(discovery): improve recipe detail and mobile filtering`.
