# Recipe Planning Continuity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect Recipe Detail, dated meal planning, and Cooking Mode so an authenticated user can add a recipe in place, cook it with plan context, and return to the plan.

**Architecture:** Keep planning server state in the existing TanStack Query hooks. Add a focused `AddToPlanDialog` that derives the meal-plan week from the selected date, uses the existing plan if present, or creates the week plan before adding the recipe. Recipe Detail owns authentication, dialog visibility, and toast feedback; the summary component owns only action presentation.

**Tech Stack:** React 19, TypeScript/TSX, React Router, TanStack Query 5, existing Axios API, SCSS, Vitest, React Testing Library, Playwright.

## Global Constraints

- Do not add backend routes, database tables, or new dependencies; reuse `/users/me/meal-plans`.
- Do not issue authenticated planning queries from a public Recipe Detail until the Add to Plan dialog is open.
- Preserve exact recipe IDs, selected date, meal slot, and servings; validate servings from 1 through 24.
- Keep all interactive controls at least 44px high, with visible focus, semantic labels, busy/disabled feedback, and reduced-motion support.
- Do not stage or modify user-owned `AGENTS.md` or `food-recipes-ai-agent-implementation-prompt.md`.

---

### Task 1: Add to Plan dialog contract

**Files:**

- Create: `src/frontend/features/planning/components/AddToPlanDialog.test.tsx`
- Create: `src/frontend/features/recipes/RecipeContainerSummary.planning.test.jsx`
- Modify: `src/frontend/features/recipes/cooking/CookingMode.guided-flow.test.jsx` only if a continuity regression is exposed.

**Interfaces:**

- `AddToPlanDialog` will receive `{ open, recipe, onClose, onAdded, isAuthenticated? }` and render `role="dialog"` when open.
- The dialog will call planning mutations with `{ planId, input: { recipeId, date, slot, servings } }` and call `onAdded` after the item is created.
- `RecipeContainerSummary` will expose optional `onAddToPlan` and `isAddingToPlan` props while preserving the existing Start cooking, Save, and Shopping actions.

- [ ] **Step 1: Write the failing dialog tests**

  Mock the existing planning query/mutations and assert default date/meal/servings, validation before submit, adding to an existing plan, and create-then-add when no plan exists:

  ```tsx
  it("submits the recipe to the existing week plan with editable defaults", () => {
    mockPlanning.week = { plan: { plan_id: 12 }, items: [] };
    renderDialog();
    expect(screen.getByLabelText("Meal")).toHaveValue("dinner");
    expect(screen.getByLabelText("Servings")).toHaveValue(4);
    fireEvent.click(screen.getByRole("button", { name: "Add to plan" }));
    expect(mockPlanning.add).toHaveBeenCalledWith({
      planId: 12,
      input: expect.objectContaining({ recipeId: 7, slot: "dinner", servings: 4 }),
    }, expect.any(Object));
  });

  it("creates the selected week plan before adding when no plan exists", () => {
    mockPlanning.week = null;
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Add to plan" }));
    expect(mockPlanning.create).toHaveBeenCalledWith(expect.objectContaining({ name: "This week" }), expect.any(Object));
  });

  it("requires a valid recipe and servings", () => {
    renderDialog({ recipe: null });
    fireEvent.click(screen.getByRole("button", { name: "Add to plan" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Choose a recipe first.");
  });
  ```

- [ ] **Step 2: Run the focused dialog test to verify RED**

  Run from `src/frontend`:

  ```powershell
  fnm exec --using v24.16.0 -- C:\Users\quy\AppData\Roaming\fnm\node-versions\v24.16.0\installation\npx.cmd --yes pnpm@11.18.0 exec vitest run features/planning/components/AddToPlanDialog.test.tsx
  ```

  Expected: FAIL because `AddToPlanDialog.tsx` and the new component contract do not exist.

- [ ] **Step 3: Write the failing Recipe Summary action test**

  Render `RecipeContainerSummary` with `onAddToPlan={vi.fn()}` and assert the labelled button calls the callback and becomes disabled with `aria-busy="true"` while pending.

- [ ] **Step 4: Run the summary test to verify RED**

  Run:

  ```powershell
  fnm exec --using v24.16.0 -- C:\Users\quy\AppData\Roaming\fnm\node-versions\v24.16.0\installation\npx.cmd --yes pnpm@11.18.0 exec vitest run features/recipes/RecipeContainerSummary.planning.test.jsx
  ```

  Expected: FAIL because the summary has no Add to Plan action yet.

---

### Task 2: Week-aware planning dialog implementation

**Files:**

- Create: `src/frontend/features/planning/components/AddToPlanDialog.tsx`
- Modify: `src/frontend/features/planning/api/planningQueries.ts`
- Modify: `src/frontend/features/planning/Planning.scss`

**Interfaces:**

- `useMealPlanForWeekQuery(range, options?: { enabled?: boolean })` keeps existing callers compatible and skips network work when disabled.
- `AddToPlanDialog` uses `getWeekRange`, `toIsoDate`, `useMealPlanForWeekQuery`, `useCreateMealPlanMutation`, and `useAddMealPlanItemMutation`.

- [ ] **Step 1: Add the optional query enablement**

  Change only the hook signature/options:

  ```ts
  export const useMealPlanForWeekQuery = (
    range: DateRange,
    options: { enabled?: boolean } = {},
  ) => useQuery({
    queryKey: planningQueryKeys.week(range.from, range.to),
    queryFn: fetchMealPlanForWeek,
    enabled: options.enabled ?? true,
    placeholderData: (previousData) => previousData,
  });
  ```

- [ ] **Step 2: Implement the minimal dialog behavior**

  Initialize `date` with `toIsoDate(new Date())`, `slot` with `dinner`, and `servings` with `4`. Derive `selectedWeek` from the date. On submit, validate recipe/date/servings; use the existing plan when available, otherwise call `createMealPlan({ name: "This week", from: selectedWeek.from, to: selectedWeek.to })`, then add:

  ```ts
  const addInput = { recipeId: recipe.recipe_id, date, slot, servings };
  const addToPlan = (planId: number) =>
    addMutation.mutate({ planId, input: addInput }, { onSuccess: onAdded });
  if (weekQuery.data?.plan) addToPlan(weekQuery.data.plan.plan_id);
  else createMutation.mutate(
    { name: "This week", from: selectedWeek.from, to: selectedWeek.to },
    { onSuccess: (response) => addToPlan(response.plan.plan_id) },
  );
  ```

  Render a semantic dialog with Date, Meal (`breakfast`, `lunch`, `dinner`, `snack`), Servings, Cancel, Add to plan, query loading copy, and non-raw retry guidance. Close on Escape only when not submitting.

- [ ] **Step 3: Add focused dialog styles**

  Reuse the existing planning dialog tokens and add `planning-dialog__recipe-context`, responsive field layout, visible focus, 44px controls, a high-contrast primary button, and a reduced-motion rule. At mobile width, keep the sheet bottom-aligned and at desktop width center it.

- [ ] **Step 4: Run the focused dialog tests to verify GREEN**

  Run the command from Task 1 and expect all dialog tests to pass.

---

### Task 3: Recipe Detail action group

**Files:**

- Modify: `src/frontend/features/recipes/Recipe.jsx`
- Modify: `src/frontend/features/recipes/RecipeContainerSummary.jsx`
- Modify: `src/frontend/features/recipes/Recipe.scss`
- Modify: `src/frontend/features/recipes/RecipeContainerSummary.planning.test.jsx`

**Interfaces:**

- `Recipe` owns `isAddToPlanOpen`, redirects guests to account with `state.from`, and passes `onAddToPlan`/`isAddingToPlan` to the summary.
- `Recipe` renders `AddToPlanDialog` next to the recipe content and shows `Added Chicken Curry to your plan` on success or actionable error copy on failure.

- [ ] **Step 1: Wire the action callback and dialog**

  Add `isAddToPlanOpen` state and handlers. For guests, navigate to `/account?signup=false` with the current path. For authenticated users, open the dialog; on success close it and call `showToast`.

- [ ] **Step 2: Add the optional summary button**

  Render a labelled button only when `onAddToPlan` exists:

  ```jsx
  <button
    type="button"
    className="recipe__container__summary__plan"
    onClick={onAddToPlan}
    disabled={isAddingToPlan}
    aria-busy={isAddingToPlan}
  >
    <strong>{isAddingToPlan ? "Adding to plan..." : "Add to plan"}</strong>
  </button>
  ```

- [ ] **Step 3: Make the action group responsive**

  Keep the existing desktop group. At `max-width: 576px`, make the group sticky to the bottom of the summary, use a cream translucent surface with a top border, stack/expand the actions to the available width, preserve 44px heights, and add `padding-bottom` so the action strip does not cover the next content. Use `prefers-reduced-motion` to remove transforms/transitions.

- [ ] **Step 4: Run Recipe Summary and existing cooking tests**

  Run:

  ```powershell
  fnm exec --using v24.16.0 -- C:\Users\quy\AppData\Roaming\fnm\node-versions\v24.16.0\installation\npx.cmd --yes pnpm@11.18.0 exec vitest run features/recipes/RecipeContainerSummary.planning.test.jsx features/recipes/RecipeContainerSummary.shopping.test.jsx features/recipes/RecipeDescription.time.test.jsx features/recipes/cooking/CookingMode.guided-flow.test.jsx
  ```

  Expect the new action plus existing Start cooking, Save, Shopping, and Cooking Mode behavior to pass.

---

### Task 4: End-to-end continuity and responsive verification

**Files:**

- Create: `src/frontend/e2e/recipe-planning-continuity.spec.js`

**Interfaces:**

- Mock the existing `/users/me/meal-plans` endpoints and Recipe Detail endpoints; no new production API is introduced.

- [ ] **Step 1: Add the authenticated journey**

  Stub an empty week plan, click Recipe Detail → Add to plan, submit date/meal/servings, assert the create then item POST payloads, return to Planning, open the planned recipe, start Cooking Mode, finish, and click Back to plan.

- [ ] **Step 2: Add the existing-plan path**

  In a second test, return an existing plan and assert Add to plan posts directly to `/meal-plans/:planId/items` without creating another plan.

- [ ] **Step 3: Add responsive checks**

  At widths 375, 768, 1024, and 1440, assert no document overflow, all `.recipe__container__summary__fav button, .recipe__container__summary__fav a` controls are at least 44px, and the mobile action group is sticky at 375px.

- [ ] **Step 4: Run the focused Playwright file**

  Build with `VITE_KONG_BASE_URL=http://127.0.0.1:3000/api/v1`, serve the Vite preview, and run:

  ```powershell
  fnm exec --using v24.16.0 -- C:\Users\quy\AppData\Roaming\fnm\node-versions\v24.16.0\installation\npx.cmd --yes pnpm@11.18.0 exec playwright test e2e/recipe-planning-continuity.spec.js --config e2e/playwright.config.js
  ```

  Expect all continuity and responsive checks to pass.

---

### Task 5: Full verification and commit

- [ ] Run frontend focused tests, full `test:ci`, lint, typecheck, and production build.
- [ ] Run backend typecheck and `prisma validate`; backend source should remain unchanged.
- [ ] Run `git diff --check` and inspect staged files.
- [ ] Stage only Phase 3 spec, plan, dialog, Recipe action, tests, and E2E files; leave user-owned files unstaged.
- [ ] Commit with `feat(planning): connect recipe planning and cooking flows`.
