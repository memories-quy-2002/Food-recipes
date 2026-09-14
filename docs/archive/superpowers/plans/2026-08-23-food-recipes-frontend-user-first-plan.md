# Food Recipes Frontend User-First Product Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve the existing React frontend from a recipe CRUD showcase into a user-first community recipe product that helps users discover what to cook, successfully follow a recipe, save it for later, review it credibly, and contribute their own recipes.

**Architecture:** Preserve the current visual identity and refactor behavior incrementally. Prioritize user journeys and business-rule correctness before visual redesign. Move remote-data concerns toward feature-level query hooks, keep URL-driven discovery state shareable, and align the frontend with the new NestJS `/api/v1` contract.

**Tech Stack:** React 19, Vite, TypeScript migration where practical, React Router, TanStack Query, Axios or a small typed API client, SCSS/design tokens, React Testing Library, Vitest/Jest depending on current setup, Playwright for E2E.

**Spec:** Existing `Food-recipes` frontend, current deployed product behavior, and the user-first UX/business-rule audit.

## Product North Star

The product should support this loop:

```text
DISCOVER
"What should I cook?"
      ↓
COOK
"Help me make it successfully."
      ↓
SHARE
"Save, rate, review, or publish my own recipe."
```

Every new feature should clearly improve at least one step in this loop.

## Global Constraints

- Keep the current warm food-oriented visual language unless a task explicitly changes it.
- Prioritize usability and business correctness over cosmetic redesign.
- Rename product concepts where current wording conflicts with user mental models.
- Do not trust frontend-only authorization; backend remains the security boundary.
- Preserve shareable filter/search state in the URL.
- Server state should move away from global context/manual `useEffect` patterns toward TanStack Query incrementally.
- Search/filter/pagination should migrate to server-side APIs after the NestJS backend supports it.
- Keyboard accessibility is required for all interactive search, card, filter, modal, rating, and navigation controls.
- Do not introduce a full design-system rewrite during the migration.
- Every task must have tests or clear acceptance checks.

---

## Target Information Architecture

```text
Home
Recipes
Saved
Community        # later phase
Profile

Primary actions:
Search
Add Recipe
Account
```

Move `News` and `About` out of primary navigation into footer/secondary navigation unless product requirements explicitly keep them prominent.

---

## Task 1: Establish Frontend Product Regression Coverage

**Files:**
- Create: `docs/frontend/current-user-journeys.md`
- Create/extend E2E tests under existing test convention

**Critical journeys:**

```text
Guest:
Home -> Search -> Recipe detail
Home -> Category -> Recipe detail
Recipes -> filter -> sort -> detail
Recipe -> Save -> login redirect

Authenticated:
Login -> return to original action
Save / unsave recipe
Rate / update review
Open Saved
Create recipe
Edit own recipe
Delete own recipe
Update profile
Change password
Logout
```

- [ ] Document the current behavior before modifying it.
- [ ] Add smoke E2E coverage for the highest-value paths.
- [ ] Commit.

```bash
git commit -m "test(web): capture critical recipe user journeys"
```

---

## Task 2: Fix P0 Discovery Sorting Bugs

**Files:**
- Modify: `src/frontend/features/home/HomeMain.jsx`
- Modify: `src/frontend/features/wishlist/Wishlist.jsx`
- Add tests for sorting helpers

### Quick Meals bug

Replace ad-hoc string parsing of `prep_time` and `cook_time` with normalized minute fields from the new API:

```ts
type RecipeSummary = {
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  totalTimeMinutes: number;
};
```

Sort:

```ts
const byQuickest = (a: RecipeSummary, b: RecipeSummary) =>
  a.totalTimeMinutes - b.totalTimeMinutes;
```

### Recently Saved bug

The Saved API must return `savedAt`.

Sort:

```ts
const byRecentlySaved = (a: SavedRecipe, b: SavedRecipe) =>
  new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
```

- [ ] Add unit tests proving both sort modes work.
- [ ] Verify visible order manually.
- [ ] Commit.

```bash
git commit -m "fix(web): correct quick meal and recently saved sorting"
```

---

## Task 3: Rename Navigation Around User Mental Models

**Files:**
- Modify: `src/frontend/shared/layout/Header.jsx`
- Modify: `src/frontend/shared/layout/HeaderMenu.jsx`
- Modify mobile header equivalents
- Modify page headings/SEO labels where necessary

**Changes:**

```text
Food      -> Recipes
Wishlist  -> Saved
```

- [ ] Keep routes temporarily compatible (`/food`, `/wishlist`) to avoid a broad routing change in the same task.
- [ ] Move `News` and `About` to secondary/footer navigation.
- [ ] Make `Add Recipe` a visible authenticated action.
- [ ] Verify desktop and mobile header behavior.
- [ ] Commit.

```bash
git commit -m "feat(web): align navigation with recipe user mental models"
```

---

## Task 4: Make Home Search the Primary Discovery Action

**Files:**
- Modify: `src/frontend/features/home/Home.jsx`
- Modify: `src/frontend/features/home/main/HomeSearchBar.jsx`
- Modify: `src/frontend/features/home/Home.scss`

**Goal:** A returning user should be able to answer "what do I want to cook?" immediately.

**Target hero hierarchy:**

```text
What do you want to cook?

[ Search recipes...                           ]

Quick dinner   Chicken   Pasta   Dessert
```

- [ ] Keep hero imagery and current warm visual identity.
- [ ] Reduce carousel dominance on repeat visits.
- [ ] Preserve "Browse all" and meal discovery as secondary actions.
- [ ] Add popular quick-filter chips driven by real taxonomy/popularity data.
- [ ] Commit.

```bash
git commit -m "feat(web): prioritize recipe search on Home"
```

---

## Task 5: Make Search Fully Keyboard Accessible

**Files:**
- Modify: `src/frontend/features/home/main/HomeSearchBar.jsx`
- Add tests for keyboard interaction

**Target behavior:**

```text
ArrowDown -> next result
ArrowUp   -> previous result
Enter     -> open active result
Escape    -> close result list
```

**Semantics:**
- input uses combobox semantics
- result list uses listbox semantics
- each result exposes option semantics
- active option is announced

- [ ] Test mouse and keyboard use.
- [ ] Ensure empty results are announced.
- [ ] Ensure focus never gets trapped.
- [ ] Commit.

```bash
git commit -m "fix(web): make recipe search keyboard accessible"
```

---

## Task 6: Fix Clickable Recipe Card Semantics

**Files:**
- Modify: `src/frontend/features/home/main/FoodCard.jsx`
- Review: `src/frontend/features/food/content/FoodContentSectionItem.jsx`

**Preferred implementation:**
Use a semantic React Router `<Link>` for the card's primary navigation.

- [ ] Keep Save/Favorite as a separate real button.
- [ ] Prevent nested interactive controls from triggering card navigation.
- [ ] Add visible focus states.
- [ ] Add accessible names to icon-only controls.
- [ ] Commit.

```bash
git commit -m "fix(web): improve recipe card semantics and keyboard access"
```

---

## Task 7: Make Featured Section Labels Match Active Mode

**Files:**
- Modify: `src/frontend/features/home/main/FoodCardList.jsx`

**Define metadata:**

```ts
const featuredModeMeta = {
  "top-rated": {
    eyebrow: "Community favorites",
    title: "Top rated recipes",
  },
  "most-reviewed": {
    eyebrow: "Popular with cooks",
    title: "Most reviewed recipes",
  },
  "quick-meals": {
    eyebrow: "Short on time",
    title: "Quick meals",
  },
};
```

- [ ] Render matching copy for the current tab.
- [ ] Ensure tabs expose selected state semantically.
- [ ] Commit.

```bash
git commit -m "fix(web): align featured recipe labels with selected mode"
```

---

## Task 8: Rank Home Categories by User Value

**Files:**
- Modify: `src/frontend/features/home/main/CategorySection.jsx`
- Modify API consumption if backend exposes popularity metrics

**Remove:**

```js
categories.slice(0, 5)
```

**Replace with:**
- popular categories
- seasonal categories
- or curated priority

- [ ] Add a deterministic ranking field/API.
- [ ] Keep "All categories".
- [ ] Do not let raw database ID determine product prominence.
- [ ] Commit.

```bash
git commit -m "feat(web): surface useful recipe categories on Home"
```

---

## Task 9: Migrate Recipe Discovery to Server-Side Querying

**Files:**
- Modify: `src/frontend/features/food/Food.jsx`
- Modify: `src/frontend/features/food/FoodContent.jsx`
- Create: `src/frontend/features/food/api/useRecipesQuery.ts`
- Create: `src/frontend/shared/api/queryClient.ts`

**API:**

```text
GET /api/v1/recipes
?q=
&categoryId=
&mealId=
&sort=
&page=
&limit=
```

- [ ] Add TanStack Query.
- [ ] Keep filter state in URL.
- [ ] Query server using URL-derived state.
- [ ] Preserve browser back/forward behavior.
- [ ] Replace client-side full-dataset pagination.
- [ ] Add loading skeleton/state that does not collapse layout.
- [ ] Commit.

```bash
git commit -m "refactor(web): use server-side recipe discovery queries"
```

---

## Task 10: Redesign Recipe Detail Around Cooking Utility

**Files:**
- Modify: `src/frontend/features/recipes/RecipeContainerSummary.jsx`
- Modify: `src/frontend/features/recipes/RecipeContent.jsx`
- Modify: `src/frontend/features/recipes/content/RecipeDescription.jsx`
- Modify: recipe styles

**Target layout:**

```text
Recipe title
Rating · review count
Author
Category / Meal / Difficulty tags

Image

Prep | Cook | Total | Servings

[ Start cooking ] [ Save ]

About
Ingredients
Instructions
Community reviews
```

- [ ] Make time data normalized and human-readable.
- [ ] Add `servings` / `yield` to the product model.
- [ ] Keep rating and Save action visible near the top.
- [ ] Make the recipe scannable on mobile.
- [ ] Commit.

```bash
git commit -m "feat(web): optimize recipe detail for cooking decisions"
```

---

## Task 11: Add Servings and Ingredient Scaling

**Files:**
- Modify recipe domain types
- Modify `RecipeDescription.jsx`
- Modify recipe editor form
- Add utility/test files for quantity scaling

**UI:**

```text
Servings  [−] 4 [+]
```

- [ ] Add `servings` to create/edit recipe.
- [ ] Scale structured ingredient quantities where available.
- [ ] If ingredients remain plain strings initially, display servings first and defer automatic scaling until ingredient data is structured.
- [ ] Do not silently alter free-text quantities unreliably.
- [ ] Commit.

```bash
git commit -m "feat(web): add recipe servings support"
```

---

## Task 12: Turn Ingredients Into a Cooking Checklist

**Files:**
- Modify: `RecipeDescription.jsx`
- Add recipe ingredient checklist component

**Target:**

```text
Ingredients

☐ 500 g chicken breast
☐ 2 tbsp olive oil
☐ 3 cloves garlic
```

- [ ] Checklist state is local to the current cooking session.
- [ ] Checking an ingredient must not mutate the saved recipe.
- [ ] Add clear checked styling without reducing readability.
- [ ] Verify mobile tap targets.
- [ ] Commit.

```bash
git commit -m "feat(web): add interactive ingredient checklist"
```

---

## Task 13: Improve Instruction Semantics and Readability

**Files:**
- Modify: `RecipeDescription.jsx`

- [ ] Replace `<ul>` with ordered semantic steps.
- [ ] Render step number separately from step text.
- [ ] Ensure long steps remain readable at mobile widths.
- [ ] Add optional time hints later only if recipe data supports them.
- [ ] Commit.

```bash
git commit -m "fix(web): improve recipe instruction semantics"
```

---

## Task 14: Add Cooking Mode

**Files:**
- Create: `src/frontend/features/recipes/cooking/CookingMode.tsx`
- Create: supporting styles/hooks
- Modify recipe detail CTA

**Flow:**

```text
Start cooking
   ↓
Step 1 of N
   ↓
Previous / Next
   ↓
Finish cooking
```

**Requirements:**
- Mobile-first full-screen or focused layout.
- Large controls.
- Current step only, with optional ingredient context.
- Optional "keep screen awake" enhancement only when safely supported.
- Exiting cooking mode returns to the same recipe.
- No backend dependency required for basic mode.

- [ ] Add E2E test for entering, navigating, and exiting cooking mode.
- [ ] Commit.

```bash
git commit -m "feat(web): add guided cooking mode"
```

---

## Task 15: Strengthen Rating and Review Trust

**Files:**
- Modify: `src/frontend/features/recipes/Recipe.jsx`
- Modify: `src/frontend/features/recipes/content/RecipeRating.jsx`
- Modify review list components
- Coordinate with backend rating rules

**Business rules:**
- one review per user per recipe
- update own review
- delete own review
- recipe author cannot review own recipe
- 1..5 integer rating
- written review optional
- show review timestamp
- show author identity
- future-ready for moderation/reporting

- [ ] Hide/disable rating UI for recipe author and explain why.
- [ ] Add "Delete my review".
- [ ] Add report action for other users' reviews once backend endpoint exists.
- [ ] Preserve existing 500-character bound.
- [ ] Commit.

```bash
git commit -m "feat(web): strengthen community review trust"
```

---

## Task 16: Add "Made This Recipe" Signal

**Files:**
- Modify rating DTO/UI when backend supports the field

**UI:**

```text
★★★★★
☑ I made this recipe
[ review text ]
```

- [ ] Persist boolean with review.
- [ ] Display a trusted "Made this recipe" indicator on review cards.
- [ ] Do not present it as verified purchase-style proof; it is self-reported.
- [ ] Commit.

```bash
git commit -m "feat(web): add made-this-recipe review signal"
```

---

## Task 17: Fix Authentication Return-to-Intent

**Files:**
- Modify Save handlers in Home and Recipe
- Modify protected routing/auth flow
- Modify login hook

**Required flow:**

```text
Guest clicks Save
   ↓
Login
   ↓
Return to same recipe
   ↓
Complete intended Save action
```

- [ ] Store `returnTo`.
- [ ] Store safe pending intent such as `saveRecipe`.
- [ ] Never allow arbitrary external redirect targets.
- [ ] Verify login from recipe, Saved, and Add Recipe paths.
- [ ] Commit.

```bash
git commit -m "feat(web): preserve user intent through authentication"
```

---

## Task 18: Rename Wishlist to Saved and Model Saved Data Correctly

**Files:**
- Modify: `src/frontend/features/wishlist/Wishlist.jsx`
- Rename feature directory later only if low-risk
- Modify visible copy first

**Target product language:**

```text
Saved Recipes
Recently saved
Highest rated
Name A-Z
```

- [ ] Render `savedAt`.
- [ ] Correctly sort recent saves.
- [ ] Improve empty state around "find something to cook".
- [ ] Keep destructive remove confirmation lightweight.
- [ ] Commit.

```bash
git commit -m "feat(web): evolve wishlist into saved recipes"
```

---

## Task 19: Add Saved Collections

**Files:**
- Create: `src/frontend/features/saved/collections/*`
- Coordinate with backend collection endpoints

**Examples:**

```text
Quick dinners
Healthy
Weekend
Meal prep
Desserts
```

- [ ] User can create/rename/delete a collection.
- [ ] User can add one recipe to multiple collections if product decision allows it.
- [ ] Keep default "All saved".
- [ ] Add collection filtering to Saved page.
- [ ] Commit.

```bash
git commit -m "feat(web): organize saved recipes into collections"
```

---

## Task 20: Fix Recipe Creation Business Rules

**Files:**
- Modify: `src/frontend/features/recipes/AddRecipe.jsx`
- Coordinate with backend taxonomy rules

**Remove arbitrary rule:**

```text
minimum 3 ingredients
minimum 3 instructions
```

**Replace with:**
- at least 1 non-empty ingredient
- at least 1 non-empty instruction
- recipe name required
- category required
- meal required
- valid positive durations
- valid serving count
- image validation based on publish state

- [ ] Remove uncontrolled "Other" category/meal auto-creation.
- [ ] If needed, add "Suggest a category" later as a moderation flow.
- [ ] Commit.

```bash
git commit -m "fix(web): enforce meaningful recipe creation rules"
```

---

## Task 21: Add Draft and Autosave to Recipe Editor

**Files:**
- Modify/Create recipe editor feature files
- Initially use local persistence; later move drafts server-side

**States:**

```text
DRAFT
PUBLISHED
```

**UI:**

```text
Saving draft...
Saved just now

[ Save draft ] [ Publish ]
```

- [ ] Autosave non-sensitive recipe form state.
- [ ] Restore draft after accidental reload.
- [ ] Image is optional for draft.
- [ ] Publish validates all required public fields.
- [ ] Provide explicit discard/reset.
- [ ] Commit.

```bash
git commit -m "feat(web): add recipe drafts and autosave"
```

---

## Task 22: Add Edit Recipe Flow

**Files:**
- Modify: `src/frontend/features/profile/PersonalRecipes.jsx`
- Create/extend recipe editor route for edit mode

**Actions:**

```text
View
Edit
Delete
```

- [ ] Prefill editor with existing recipe.
- [ ] Save via `PATCH /api/v1/recipes/:id`.
- [ ] Show unsaved-change warning when navigating away.
- [ ] After save, refresh detail and personal recipe caches.
- [ ] Add E2E ownership test.
- [ ] Commit.

```bash
git commit -m "feat(web): allow authors to edit their recipes"
```

---

## Task 23: Improve Destructive Dialog Accessibility

**Files:**
- Modify Saved remove dialog
- Modify Personal Recipes delete dialog
- Prefer a shared accessible dialog component

- [ ] Use `role="dialog"` and `aria-modal="true"`.
- [ ] Give dialog an accessible title/description.
- [ ] Move focus into the dialog on open.
- [ ] Trap focus while open.
- [ ] Close on Escape.
- [ ] Return focus to trigger on close.
- [ ] Commit.

```bash
git commit -m "fix(web): make destructive dialogs accessible"
```

---

## Task 24: Replace Manual Server-State Contexts Incrementally

**Files:**
- Review: `RecipeProvider.jsx`
- Create query hooks under feature API directories
- Add QueryClient provider

**Migration order:**
1. Recipes list
2. Recipe detail
3. Reviews
4. Saved recipes
5. User profile server data

- [ ] Keep Redux only for true client/session state if still useful.
- [ ] Avoid duplicate caching between Context, Redux, and TanStack Query.
- [ ] Configure stale times based on data volatility.
- [ ] Invalidate targeted queries after mutation.
- [ ] Commit in feature-sized steps, not one giant refactor.

---

## Task 25: Add Frontend Performance Guardrails

**Files:**
- Build config and performance tests as appropriate

- [ ] Lazy-load heavy recipe-detail/cooking/editor code.
- [ ] Ensure recipe images have stable dimensions to reduce layout shift.
- [ ] Add responsive image behavior where possible.
- [ ] Avoid rendering the entire recipe library in the browser.
- [ ] Track bundle size regression.
- [ ] Verify key pages on throttled mobile conditions.

```bash
git commit -m "perf(web): add recipe frontend performance guardrails"
```

---

## Task 26: Final E2E Product Verification

**Flows:**

### Guest
- [ ] Home search via mouse.
- [ ] Home search via keyboard.
- [ ] Filter recipe library.
- [ ] Open recipe.
- [ ] Start cooking mode.
- [ ] Attempt Save -> login -> return -> save.

### Authenticated consumer
- [ ] Save recipe.
- [ ] Remove saved recipe.
- [ ] Create collection.
- [ ] Rate another user's recipe.
- [ ] Update review.
- [ ] Delete own review.
- [ ] Cannot rate own recipe.

### Contributor
- [ ] Create draft.
- [ ] Reload and restore draft.
- [ ] Publish recipe.
- [ ] Edit recipe.
- [ ] Delete recipe.

### Accessibility
- [ ] Header usable by keyboard.
- [ ] Search usable by keyboard.
- [ ] Cards expose semantic navigation.
- [ ] Rating stars usable by keyboard.
- [ ] Dialog focus management works.
- [ ] Visible focus states present.

### Responsive
- [ ] 360px mobile.
- [ ] tablet.
- [ ] desktop.
- [ ] Recipe cooking mode usable one-handed on mobile.

---

## Final Definition of Done

- [ ] Home prioritizes finding something to cook.
- [ ] Quick Meals actually sorts by total duration.
- [ ] Featured labels match selected mode.
- [ ] Home category ranking is product-driven, not DB-ID-driven.
- [ ] Search and cards are keyboard accessible.
- [ ] Recipe discovery is URL-driven and server-paginated.
- [ ] `Food` is presented as `Recipes`.
- [ ] `Wishlist` is presented as `Saved`.
- [ ] Login returns users to their original intent.
- [ ] Recipe detail exposes prep, cook, total time, servings, Save, and Start Cooking.
- [ ] Ingredients support checklist behavior.
- [ ] Instructions are semantic ordered steps.
- [ ] Cooking Mode works on mobile.
- [ ] Recipe authors cannot review their own recipe.
- [ ] Reviews can be updated/deleted by their authors.
- [ ] Saved recipes sort correctly by save timestamp.
- [ ] Recipe creation no longer requires arbitrary 3+ ingredient/step counts.
- [ ] Taxonomy cannot be polluted by arbitrary category/meal creation.
- [ ] Recipe drafts/autosave protect contributor work.
- [ ] Authors can edit their own recipes.
- [ ] Server state is progressively managed by TanStack Query.
- [ ] Critical guest, consumer, and contributor E2E flows pass.
