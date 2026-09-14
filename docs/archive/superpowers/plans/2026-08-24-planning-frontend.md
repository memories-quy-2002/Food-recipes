# Planning Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an authenticated, responsive weekly meal-planning workflow at `/planning` using the existing planning API and recipe discovery/saved-recipe data.

**Architecture:** Keep planning server state in TanStack Query. Put date arithmetic, response normalization, and API calls in feature-level TypeScript modules; keep dialog, picker, and temporary form values local to React components. Use the existing Axios client, ProtectedRoute, PageHelmet, PageState, React Router, and the current warm Food Recipes styling language without a repository-wide CSS migration.

**Tech Stack:** React 19, TypeScript/TSX, React Router, TanStack Query 5, Axios, React Bootstrap layout primitives where they already fit, SCSS, Vitest, React Testing Library, Playwright.

## Global Constraints

- Preserve the current warm food-oriented visual language; do not perform a full redesign.
- Keep server state in TanStack Query and local dialog/form state local.
- Do not create duplicate planning modules, tables, or endpoints.
- New frontend code prefers TypeScript and must not use `any`, `unknown as X`, or `@ts-ignore`.
- Interactive controls must be keyboard accessible, have visible focus states, semantic names, and practical 44px touch targets.
- Mobile must not render an unusable seven-column grid; render one day at a time vertically on small screens.
- Use the existing Axios client and `/api/v1/users/me/meal-plans` backend contract.
- All API failure, empty, loading, and unauthenticated states must be actionable and must not expose raw API errors.
- Preserve user-owned changes and unrelated existing worktree changes.

---

### Task 1: Planning domain types, date helpers, and API hooks

**Files:**
- Create: `src/frontend/features/planning/api/planningApi.ts`
- Create: `src/frontend/features/planning/api/planningDates.ts`
- Create: `src/frontend/features/planning/api/planningQueries.ts`
- Create: `src/frontend/features/planning/api/planningApi.test.ts`
- Create: `src/frontend/features/planning/api/planningDates.test.ts`
- Modify: `src/frontend/shared/api/routes.js`

**Interfaces:**
- `MealSlot = "breakfast" | "lunch" | "dinner" | "snack"`.
- `MealPlanItem` contains `item_id`, `plan_id`, `recipe_id`, `recipe_name`, `planned_date`, `slot`, and `servings`.
- `MealPlanResponse` contains `plan` and `items`.
- `getWeekRange(date: Date): { from: string; to: string; days: PlanningDay[] }` returns a Monday-Sunday ISO week without timezone drift.
- `useMealPlanForWeekQuery(range)` returns `{ plan, items } | null` and treats an empty list response as no plan.
- Mutations expose `useCreateMealPlanMutation`, `useAddMealPlanItemMutation`, `useUpdateMealPlanItemMutation`, and `useDeleteMealPlanItemMutation`; each invalidates the week query after success.

- [ ] **Step 1: Write failing date and API contract tests**

```ts
it("returns a Monday-Sunday range for a date in the middle of the week", () => {
  expect(getWeekRange(new Date("2026-08-26T12:00:00Z"))).toMatchObject({
    from: "2026-08-24",
    to: "2026-08-30",
  });
});

it("posts an item using the backend field names", async () => {
  axios.post = vi.fn().mockResolvedValue({ data: { item: { item_id: 4 } } });
  await addMealPlanItem(12, { recipeId: 7, date: "2026-08-24", slot: "dinner", servings: 4 });
  expect(axios.post).toHaveBeenCalledWith("/users/me/meal-plans/12/items", {
    recipeId: 7,
    date: "2026-08-24",
    slot: "dinner",
    servings: 4,
  });
});
```

- [ ] **Step 2: Run the focused tests and verify they fail because the feature modules do not exist**

Run from `src/frontend`:

```bash
corepack pnpm@11.18.0 exec vitest run features/planning/api/planningApi.test.ts features/planning/api/planningDates.test.ts
```

Expected: FAIL with module/function-not-found errors, not a test-runner configuration error.

- [ ] **Step 3: Add the planning route constants and typed API functions**

Implement `planningApi.ts` with the existing Axios client and these functions:

```ts
export const listMealPlans = (range?: DateRange) =>
  axios.get<MealPlanListResponse>(apiRoutes.mealPlans, { params: range });

export const getMealPlan = (planId: number) =>
  axios.get<MealPlanResponse>(apiRoutes.mealPlan(planId));

export const createMealPlan = (input: CreateMealPlanInput) =>
  axios.post<MealPlanResponse>(apiRoutes.mealPlans, input);

export const addMealPlanItem = (planId: number, input: AddMealPlanItemInput) =>
  axios.post<MealPlanItemResponse>(apiRoutes.mealPlanItems(planId), input);

export const updateMealPlanItem = (planId: number, itemId: number, input: UpdateMealPlanItemInput) =>
  axios.patch<MealPlanItemResponse>(apiRoutes.mealPlanItem(planId, itemId), input);

export const deleteMealPlanItem = (planId: number, itemId: number) =>
  axios.delete<MessageResponse>(apiRoutes.mealPlanItem(planId, itemId));
```

Normalize date values returned by PostgreSQL to `YYYY-MM-DD` before comparing them.

- [ ] **Step 4: Add date helpers and TanStack Query hooks**

Use stable keys such as:

```ts
export const planningQueryKeys = {
  all: ["planning"] as const,
  week: (from: string, to: string) => ["planning", "week", from, to] as const,
  savedRecipes: ["planning", "saved-recipes"] as const,
};
```

The week query first lists owner-scoped plans for the visible range, chooses the first overlapping plan, then fetches its items. The empty list result is `null`; it is not an error.

- [ ] **Step 5: Run the focused tests and verify they pass**

Run the same Vitest command. Expected: all focused API/date tests pass.

### Task 2: Protected route, navigation, and planner page shell

**Files:**
- Create: `src/frontend/features/planning/PlanningPage.tsx`
- Create: `src/frontend/features/planning/PlanningPage.test.tsx`
- Create: `src/frontend/features/planning/Planning.scss`
- Modify: `src/frontend/app/AppRoutes.jsx`
- Modify: `src/frontend/shared/layout/navigation.js`

**Interfaces:**
- `PlanningPage` owns the visible week, create-plan state, and selected slot dialog state.
- `PlanningPage` renders `WeekNavigator`, `MealPlanGrid`, and `AddMealDialog` through explicit props.
- The route is wrapped by the existing `ProtectedRoute` and uses `/planning` as its canonical URL.

- [ ] **Step 1: Write failing route/navigation/page tests**

```tsx
it("exposes Planning only for authenticated navigation", () => {
  expect(getPrimaryNavigation(true)).toEqual(expect.arrayContaining([
    { title: "Planning", href: "/planning" },
  ]));
  expect(getPrimaryNavigation(false)).not.toEqual(expect.arrayContaining([
    { title: "Planning", href: "/planning" },
  ]));
});

it("shows an actionable empty state when the visible week has no plan", () => {
  renderWithQueryClient(<PlanningPage />);
  expect(screen.getByRole("heading", { name: "Plan your week" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Start a weekly plan" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the focused tests and verify they fail for missing route/page behavior**

```bash
corepack pnpm@11.18.0 exec vitest run features/planning/PlanningPage.test.tsx shared/layout/Header.navigation.test.jsx
```

Expected: FAIL because the Planning route/navigation/page has not been added.

- [ ] **Step 3: Add `/planning` and authenticated navigation**

Add a protected route in `AppRoutes.jsx` and insert `Planning` after `Saved` in `getPrimaryNavigation`, preserving all existing items and active-route behavior.

- [ ] **Step 4: Implement the page shell**

Use `PageHelmet`, a semantic `<main>`, a compact eyebrow/title/description, week navigation, and a primary `Start a weekly plan` action. The page must render a skeleton while the week query is pending and a retry action when the query fails.

- [ ] **Step 5: Add the responsive visual system**

Create feature-scoped SCSS using semantic variables already present in the app. Apply the UI/UX Pro Max findings: mobile-first breakpoints at approximately 375/768/1024/1440, body text at least 16px on mobile, 44px controls, 8px minimum touch spacing, visible `:focus-visible`, transitions of 150-300ms, and `prefers-reduced-motion: reduce`.

- [ ] **Step 6: Run focused tests and verify the route/page shell passes**

```bash
corepack pnpm@11.18.0 exec vitest run features/planning/PlanningPage.test.tsx shared/layout/Header.navigation.test.jsx
```

### Task 3: Weekly planner grid and meal item actions

**Files:**
- Create: `src/frontend/features/planning/components/WeekNavigator.tsx`
- Create: `src/frontend/features/planning/components/WeekNavigator.test.tsx`
- Create: `src/frontend/features/planning/components/MealPlanGrid.tsx`
- Create: `src/frontend/features/planning/components/MealPlanGrid.test.tsx`
- Create: `src/frontend/features/planning/components/MealSlot.tsx`

**Interfaces:**
- `WeekNavigator({ range, onPrevious, onNext, isCurrentWeek })` exposes labelled previous/next buttons and the visible date range.
- `MealPlanGrid({ days, items, onAdd, onEdit, onRemove, onOpenRecipe })` groups items by ISO date and slot.
- `MealSlot({ day, slot, item, onAdd, onEdit, onRemove, onOpenRecipe })` renders either an accessible add button or an item card.

- [ ] **Step 1: Write failing component tests**

```tsx
it("renders every day and slot without relying on hover", () => {
  render(<MealPlanGrid days={weekDays} items={[]} onAdd={vi.fn()} onEdit={vi.fn()} onRemove={vi.fn()} onOpenRecipe={vi.fn()} />);
  expect(screen.getByRole("heading", { name: "Monday" })).toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: /Add recipe to/ })).toHaveLength(28);
});

it("exposes planned recipe actions with accessible names", () => {
  render(<MealSlot day={monday} slot="dinner" item={plannedDinner} onAdd={vi.fn()} onEdit={vi.fn()} onRemove={vi.fn()} onOpenRecipe={vi.fn()} />);
  expect(screen.getByRole("link", { name: "Open Chicken Curry" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Change Chicken Curry" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Remove Chicken Curry from dinner" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests and verify the expected missing-component failures**

```bash
corepack pnpm@11.18.0 exec vitest run features/planning/components/WeekNavigator.test.tsx features/planning/components/MealPlanGrid.test.tsx
```

- [ ] **Step 3: Implement the navigator, grid, and slot components**

Render semantic headings and lists. The desktop layout may use seven columns; under the mobile breakpoint, use one day section at a time with four stacked slots. Include a visible date label and never make drag-and-drop the only path.

- [ ] **Step 4: Wire mutation callbacks and recipe links**

Use `/recipe?id=<recipe_id>` for existing compatibility. Disable a remove button while its mutation is pending and announce mutation feedback through the existing toast provider or an `aria-live="polite"` status.

- [ ] **Step 5: Run focused component tests and verify they pass**

Run the command from Step 2 and confirm all planner component tests pass.

### Task 4: Add/edit meal dialog and saved/discovery recipe picker

**Files:**
- Create: `src/frontend/features/planning/components/AddMealDialog.tsx`
- Create: `src/frontend/features/planning/components/AddMealDialog.test.tsx`
- Create: `src/frontend/features/planning/components/RecipePicker.tsx`
- Create: `src/frontend/features/planning/components/RecipePicker.test.tsx`
- Modify: `src/frontend/features/planning/api/planningQueries.ts`

**Interfaces:**
- `AddMealDialog({ open, initialDate, initialSlot, item, onClose, onSubmit, isSubmitting, error })` owns only temporary date, slot, servings, and selected recipe values.
- `RecipePicker({ selectedRecipeId, onSelect })` reads saved recipes first and server-searches discovery with a debounced query of 250ms and a minimum of two characters.
- The submit payload is `{ recipeId, date, slot, servings }` for new items and a partial equivalent for edits.

- [ ] **Step 1: Write failing dialog and picker tests**

```tsx
it("requires a recipe and exposes labelled planning fields", async () => {
  render(<AddMealDialog open initialDate="2026-08-24" initialSlot="dinner" onClose={vi.fn()} onSubmit={vi.fn()} isSubmitting={false} />);
  expect(screen.getByLabelText("Date")).toHaveValue("2026-08-24");
  expect(screen.getByLabelText("Meal")).toHaveValue("dinner");
  expect(screen.getByLabelText("Servings")).toHaveValue(4);
  await userEvent.click(screen.getByRole("button", { name: "Add to plan" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Choose a recipe first.");
});

it("shows a server-search result only after two characters", async () => {
  render(<RecipePicker selectedRecipeId={null} onSelect={vi.fn()} />);
  await userEvent.type(screen.getByRole("searchbox", { name: "Search recipes" }), "ch");
  expect(await screen.findByText("Chicken Curry")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run focused tests and verify the missing dialog/picker behavior fails**

```bash
corepack pnpm@11.18.0 exec vitest run features/planning/components/AddMealDialog.test.tsx features/planning/components/RecipePicker.test.tsx
```

- [ ] **Step 3: Implement the picker using existing saved and recipe discovery contracts**

Reuse `RecipeContext` only for saved recipe identity matching already used by Wishlist, fetch the authenticated wishlist through a feature query, and use `useRecipesQuery` for discovery search. Do not add a new global store or fetch a new unbounded catalog from the planner.

- [ ] **Step 4: Implement accessible dialog behavior**

Use a semantic dialog with a labelled close button, Escape support, focus on the search field when opened, visible inline validation, disabled/busy submit state, and a polite success/error status. Preserve focus on the trigger after closing where practical.

- [ ] **Step 5: Run focused tests and verify they pass**

Run the command from Step 2 and confirm all dialog/picker tests pass.

### Task 5: Integrate the page, cooking entry point, and end-to-end coverage

**Files:**
- Modify: `src/frontend/features/planning/PlanningPage.tsx`
- Modify: `src/frontend/features/recipes/Recipe.jsx`
- Modify: `src/frontend/features/recipes/RecipeContainerSummary.jsx`
- Modify: `src/frontend/features/recipes/cooking/CookingMode.tsx`
- Modify: `src/frontend/features/recipes/cooking/CookingMode.scss`
- Modify: `src/frontend/e2e/current-user-journeys.spec.js`
- Create: `src/frontend/e2e/planning-journey.spec.js`

**Interfaces:**
- Planning `Start cooking` links to `/recipe/cooking?id=<recipeId>&planItemId=<itemId>&returnTo=/planning`.
- Cooking mode reads optional `planItemId` and `returnTo`, displays `Monday · Dinner · 4 servings`, and after completion offers `Back to plan` without forcing a review.

- [ ] **Step 1: Write the failing Playwright journey**

The journey must mock the existing API shape and cover:

```text
authenticated user → /planning → create plan → add Monday dinner
→ change servings → start cooking → finish → Back to plan
```

- [ ] **Step 2: Run the new journey and verify it fails before integration**

```bash
corepack pnpm@11.18.0 exec playwright test e2e/planning-journey.spec.js --config e2e/playwright.config.js
```

- [ ] **Step 3: Connect page mutations and cooking context**

Invalidate the visible week after each successful mutation. Keep local form values until the server responds; on failure leave the dialog open and show a retryable message.

- [ ] **Step 4: Implement the optional cooking return context**

Keep guest cooking behavior unchanged when the query parameters are absent. Add only contextual metadata and a return link when `planItemId` and `returnTo` are present.

- [ ] **Step 5: Run the Playwright journey and the existing cooking journeys**

```bash
corepack pnpm@11.18.0 exec playwright test e2e/planning-journey.spec.js e2e/current-user-journeys.spec.js --config e2e/playwright.config.js
```

### Task 6: Full verification and Conventional Commit

**Files:**
- Modify only files already listed above if verification exposes a feature-specific defect.

- [ ] **Step 1: Run frontend checks**

```bash
cd src/frontend
corepack pnpm@11.18.0 run check
corepack pnpm@11.18.0 run test:e2e:ci
corepack pnpm@11.18.0 run build
```

- [ ] **Step 2: Run backend regression checks relevant to the reused planning API**

```bash
cd src/backend
corepack pnpm@11.18.0 run prisma:validate
corepack pnpm@11.18.0 run check
corepack pnpm@11.18.0 run build
```

- [ ] **Step 3: Audit the UI against the requested CSS guideline**

Verify layout at 375px, 768px, 1024px, and 1440px; check no horizontal overflow, 44px controls, 8px touch spacing, visible focus, semantic labels, loading skeleton, actionable empty/error states, 150-300ms transitions, and reduced-motion behavior.

- [ ] **Step 4: Review the diff and commit only feature files**

```bash
git diff --check
git status --short
git add src/frontend docs/superpowers/plans/2026-08-24-planning-frontend.md
git commit -m "feat(planning): add weekly meal planner frontend"
```

Do not stage the pre-existing `AGENTS.md` or `food-recipes-ai-agent-implementation-prompt.md` changes.
