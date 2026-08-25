# Recipe Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an owner-only edit workflow that reuses the existing recipe editor for drafts, published recipes, and restored archived recipes.

**Architecture:** Extract the current create form into a shared `RecipeEditor` with `create` and `edit` modes. Edit mode loads the owner-scoped recipe list, saves the base recipe through the existing `PATCH` endpoint, then replaces structured ingredients, nutrition, and tags through the existing owner-scoped endpoints. No backend route or migration is added.

**Tech Stack:** React/JSX, React Router, Axios, TanStack Query where already used, NestJS existing recipe API, Vitest/Testing Library, Playwright, existing UI primitives.

**Spec:** `docs/superpowers/specs/2026-08-25-recipe-editing-design.md`

## Global Constraints

- Work only on `feature/recipe-workflows`; do not commit to `master`.
- Preserve unrelated dirty files and stage only files listed in the task being committed.
- Do not add a dependency or duplicate recipe validation/schema logic.
- Keep ownership and lifecycle authorization on the backend; never trust a route user ID.
- Preserve `/food/add`, `/profile`, `/recipe?id=`, draft serialization, image handling, and existing publish/archive/restore behavior.
- New UI must include loading, empty, error, success, mobile, keyboard, focus-visible, and accessible field-error states.

---

### Task 1: Establish the shared editor contract

**Files:**
- Create: `src/frontend/features/recipes/RecipeEditor.jsx`
- Modify: `src/frontend/features/recipes/AddRecipe.jsx`
- Create: `src/frontend/features/recipes/RecipeEditor.test.jsx`

**Interfaces:**
- Consumes: existing create form state, `recipeForm.schema.js`, draft storage helpers, upload helper, taxonomy data, toast provider.
- Produces: `RecipeEditor({ mode, recipeId, initialRecipe, onSaved })` and the existing create-mode behavior through `AddRecipe`.

- [ ] **Step 1: Write the failing editor contract tests**

```jsx
it('renders create mode without an edit identifier', () => {
  render(<RecipeEditor mode="create" onSaved={vi.fn()} />);
  expect(screen.getByRole('heading', { name: /add a recipe/i })).toBeInTheDocument();
});

it('hydrates edit mode from an owner recipe without changing the draft key', () => {
  render(<RecipeEditor mode="edit" recipeId={42} initialRecipe={fixtureRecipe} onSaved={vi.fn()} />);
  expect(screen.getByLabelText(/recipe name/i)).toHaveValue('Tomato pasta');
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run from `src/frontend`:

```powershell
pnpm exec vitest run features/recipes/RecipeEditor.test.jsx
```

Expected: FAIL because `RecipeEditor` does not exist.

- [ ] **Step 3: Extract the minimal shared editor**

Move only the form state, field rendering, validation, draft persistence, image handling, and submit actions that currently belong to `AddRecipe` into `RecipeEditor`. Keep route/page helmet and create navigation in `AddRecipe`. Use a discriminated mode instead of separate duplicated forms:

```jsx
<RecipeEditor
  mode="create"
  recipeId={null}
  initialRecipe={null}
  onSaved={({ recipe, mode }) => navigate(mode === 'create' ? '/food' : `/recipe?id=${recipe.recipe_id}`)}
/>
```

- [ ] **Step 4: Run the focused tests and existing create tests**

Run:

```powershell
pnpm exec vitest run features/recipes/RecipeEditor.test.jsx features/recipes/recipeDraftStorage.test.js
```

Expected: PASS, with existing Add Recipe tests unchanged or updated only for the extracted component boundary.

- [ ] **Step 5: Commit the shared editor boundary**

```powershell
git add src/frontend/features/recipes/RecipeEditor.jsx src/frontend/features/recipes/AddRecipe.jsx src/frontend/features/recipes/RecipeEditor.test.jsx src/frontend/features/recipes/recipeDraftStorage.test.js
git commit -m "refactor(recipes): share recipe editor state"
```

### Task 2: Add owner recipe loading and edit navigation

**Files:**
- Create: `src/frontend/features/recipes/EditRecipe.jsx`
- Create: `src/frontend/features/recipes/editRecipeApi.ts`
- Create: `src/frontend/features/recipes/editRecipeApi.test.ts`
- Modify: `src/frontend/app/AppRoutes.jsx`
- Modify: `src/frontend/features/profile/PersonalRecipes.jsx`
- Modify: `src/frontend/shared/api/routes.js`

**Interfaces:**
- Consumes: `GET /users/me/recipes?status=all`, `RecipeEditor`, `ProtectedRoute`.
- Produces: `/food/edit?id=<recipeId>` and `loadOwnedRecipe(recipeId): Promise<RecipeEditorValue>`.

- [ ] **Step 1: Write failing route and loader tests**

```ts
it('selects the requested recipe from the owner-scoped response', async () => {
  mockAxiosGet.mockResolvedValue({ data: { recipes: [{ recipe_id: 42, recipe_name: 'Tomato pasta' }] } });
  await expect(loadOwnedRecipe(42)).resolves.toMatchObject({ recipe_id: 42 });
});

it('rejects a recipe absent from the owner response', async () => {
  mockAxiosGet.mockResolvedValue({ data: { recipes: [] } });
  await expect(loadOwnedRecipe(42)).rejects.toMatchObject({ code: 'OWNED_RECIPE_NOT_FOUND' });
});
```

- [ ] **Step 2: Run the tests to verify failure**

```powershell
pnpm exec vitest run features/recipes/editRecipeApi.test.ts
```

Expected: FAIL because the loader and edit route do not exist.

- [ ] **Step 3: Implement the owner-scoped loader and route**

Use the existing owner route; do not call the public recipe detail endpoint for drafts:

```ts
export async function loadOwnedRecipe(recipeId: number) {
  const response = await axios.get(apiRoutes.userRecipes, { params: { status: 'all' } });
  const recipe = getArrayPayload(response.data, 'recipes').find((item) => Number(item.recipe_id) === recipeId);
  if (!recipe) throw { code: 'OWNED_RECIPE_NOT_FOUND' };
  return recipe;
}
```

Add a protected `/food/edit` route, parse and validate the numeric query ID, render loading/error/not-found states, and pass the loaded recipe into `RecipeEditor mode="edit"`. Add `Edit` to each owned recipe card. Do not show edit for a deleted/missing item; keep existing lifecycle controls unchanged.

- [ ] **Step 4: Run focused tests and lint**

```powershell
pnpm exec vitest run features/recipes/editRecipeApi.test.ts features/profile/PersonalRecipes.test.jsx
pnpm exec eslint features/recipes/EditRecipe.jsx features/recipes/editRecipeApi.ts features/profile/PersonalRecipes.jsx app/AppRoutes.jsx
```

Expected: PASS.

- [ ] **Step 5: Commit the edit entry point**

```powershell
git add src/frontend/features/recipes/EditRecipe.jsx src/frontend/features/recipes/editRecipeApi.ts src/frontend/features/recipes/editRecipeApi.test.ts src/frontend/app/AppRoutes.jsx src/frontend/features/profile/PersonalRecipes.jsx src/frontend/shared/api/routes.js
git commit -m "feat(recipes): add owner edit route"
```

### Task 3: Implement edit persistence and lifecycle copy

**Files:**
- Create: `src/frontend/features/recipes/recipeEditorApi.ts`
- Create: `src/frontend/features/recipes/recipeEditorApi.test.ts`
- Modify: `src/frontend/features/recipes/RecipeEditor.jsx`
- Modify: `src/frontend/features/recipes/EditRecipe.jsx`
- Modify: `src/frontend/features/profile/PersonalRecipes.jsx`

**Interfaces:**
- Consumes: `RecipeEditPayload` from the approved spec and existing route helpers.
- Produces: `saveRecipeEdits(recipeId, payload)` returning the refreshed `RecipeDetail`.

- [ ] **Step 1: Write the failing save-order tests**

```ts
it('updates base data before replacing structured metadata', async () => {
  await saveRecipeEdits(42, fixturePayload);
  expect(mockAxios).toHaveBeenNthCalledWith(1, 'patch', '/recipes/42', fixturePayload.base);
  expect(mockAxios).toHaveBeenNthCalledWith(2, 'put', '/recipes/42/ingredients', fixturePayload.ingredients);
  expect(mockAxios).toHaveBeenNthCalledWith(3, 'put', '/recipes/42/nutrition', fixturePayload.nutrition);
  expect(mockAxios).toHaveBeenNthCalledWith(4, 'put', '/recipes/42/dietary-tags', fixturePayload.tags);
});

it('does not report success when a metadata replacement fails', async () => {
  mockAxios.mockRejectedValueOnce(new Error('nutrition unavailable'));
  await expect(saveRecipeEdits(42, fixturePayload)).rejects.toThrow('nutrition unavailable');
});
```

- [ ] **Step 2: Run the focused tests to verify failure**

```powershell
pnpm exec vitest run features/recipes/recipeEditorApi.test.ts
```

Expected: FAIL because the orchestration function does not exist.

- [ ] **Step 3: Implement the minimal sequential save orchestration**

```ts
export async function saveRecipeEdits(recipeId: number, payload: RecipeEditPayload) {
  await axios.patch(apiRoutes.recipe(recipeId), payload.base);
  if (payload.ingredients) await axios.put(apiRoutes.recipeIngredients(recipeId), payload.ingredients);
  if (payload.nutrition) await axios.put(apiRoutes.recipeNutrition(recipeId), payload.nutrition);
  if (payload.tags) await axios.put(apiRoutes.recipeDietaryTags(recipeId), payload.tags);
  return getRecipeDetail(recipeId);
}
```

Use the existing payload serializers and preserve empty structured arrays when the user intentionally removes all rows. The editor disables submit during the sequence, keeps form state after failure, identifies the failed section, and invalidates owner/detail queries after success.

- [ ] **Step 4: Add lifecycle-aware actions and verify all editor states**

Published recipes show `Save changes`; drafts show `Save draft` and existing `Publish`; archived recipes show a restore path instead of an edit action until restored. Add tests for success, field validation, server validation, partial failure, retry, keyboard operation, and mobile layout.

- [ ] **Step 5: Run focused checks**

```powershell
pnpm exec vitest run features/recipes/recipeEditorApi.test.ts features/recipes/RecipeEditor.test.jsx features/recipes/RecipeEditor.accessibility.test.jsx
pnpm exec eslint features/recipes/RecipeEditor.jsx features/recipes/EditRecipe.jsx features/recipes/recipeEditorApi.ts
pnpm exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 6: Commit the completed edit workflow**

```powershell
git add src/frontend/features/recipes/recipeEditorApi.ts src/frontend/features/recipes/recipeEditorApi.test.ts src/frontend/features/recipes/RecipeEditor.jsx src/frontend/features/recipes/EditRecipe.jsx src/frontend/features/profile/PersonalRecipes.jsx
git commit -m "feat(recipes): enable editing owned recipes"
```

### Task 4: Verify the edit journey in a browser

**Files:**
- Create: `src/frontend/e2e/recipe-edit-journey.spec.js`

- [ ] **Step 1: Add a deterministic authenticated journey**

Stub `GET /users/me/recipes`, `PATCH /recipes/:id`, the three metadata PUTs, and `GET /recipes/:id`. Assert that a user can open Edit, change the title, save, and see the updated title.

- [ ] **Step 2: Run the journey**

```powershell
pnpm test:e2e -- e2e/recipe-edit-journey.spec.js
```

Expected: PASS at desktop and mobile projects.

- [ ] **Step 3: Run the final feature verification**

```powershell
pnpm check
pnpm build
pnpm test:e2e:ci
```

Expected: PASS with no new console errors, accessibility violations, or horizontal overflow.
