# Cooking History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Record private recipe-completion events for authenticated users and expose a protected history page with a Cook again action.

**Architecture:** Add a small NestJS `cooking-history` module backed by an append-only `cooking_history` table. `Recipe.jsx` owns the authenticated mutation and passes an `onComplete` callback into presentational `CookingMode`; guests continue cooking without persistence.

**Tech Stack:** Prisma/PostgreSQL, NestJS, class-validator, React/TSX, TanStack Query, Axios, Vitest/Testing Library, Jest/Supertest, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-25-cooking-history-design.md`

## Global Constraints

- Work only on `feature/recipe-workflows`; do not commit to `master`.
- History is private and always scoped to the authenticated JWT user.
- Do not add public activity, streaks, achievements, notifications, or automatic plan completion.
- Recording failure never blocks the completion state.
- Preserve existing Cooking Mode keyboard controls, timer behavior, plan context, and guest flow.
- New screens must include loading, empty, error, mobile, keyboard, focus-visible, and confirmation states.

---

### Task 1: Add the cooking history database model

**Files:**
- Modify: `src/backend/prisma/schema.prisma`
- Create: `src/backend/prisma/migrations/20260825130000_add_cooking_history/migration.sql`
- Create: `src/backend/test/cooking-history-migration.validation.mjs`

**Interfaces:**
- Produces: `CookingHistory` model with `id`, `userId`, `recipeId`, `servings`, `cookedAt`.

- [ ] **Step 1: Write failing migration validation** for table columns, owner/date indexes, and no uniqueness constraint on recipe/user (repeated cooking is valid).
- [ ] **Step 2: Run it and verify failure**

```powershell
cd src/backend
corepack pnpm@11.18.0 exec node test/cooking-history-migration.validation.mjs
```

- [ ] **Step 3: Add the additive migration**

```sql
CREATE TABLE cooking_history (
  history_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  recipe_id INTEGER NOT NULL,
  servings INTEGER NOT NULL DEFAULT 1,
  cooked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT cooking_history_servings_check CHECK (servings BETWEEN 1 AND 24)
);
CREATE INDEX cooking_history_user_cooked_idx ON cooking_history (user_id, cooked_at DESC);
CREATE INDEX cooking_history_user_recipe_idx ON cooking_history (user_id, recipe_id);
```

Add the Prisma model with explicit `@map` names and no destructive changes.

- [ ] **Step 4: Run Prisma validation**

```powershell
corepack pnpm@11.18.0 prisma:validate
corepack pnpm@11.18.0 exec node test/cooking-history-migration.validation.mjs
```

- [ ] **Step 5: Commit the schema**

```powershell
git add src/backend/prisma/schema.prisma src/backend/prisma/migrations/20260825130000_add_cooking_history/migration.sql src/backend/test/cooking-history-migration.validation.mjs
git commit -m "feat(history): add cooking history storage"
```

### Task 2: Implement the owner-scoped backend module

**Files:**
- Create: `src/backend/src/modules/cooking-history/cooking-history.repository.ts`
- Create: `src/backend/src/modules/cooking-history/cooking-history.service.ts`
- Create: `src/backend/src/modules/cooking-history/cooking-history.controller.ts`
- Create: `src/backend/src/modules/cooking-history/cooking-history.module.ts`
- Create: `src/backend/src/modules/cooking-history/dto/create-cooking-history.dto.ts`
- Create: `src/backend/src/modules/cooking-history/dto/cooking-history-query.dto.ts`
- Create: `src/backend/src/modules/cooking-history/cooking-history.service.spec.ts`
- Create: `src/backend/test/cooking-history.e2e-spec.ts`
- Modify: `src/backend/src/app.module.ts`
- Modify: `src/backend/src/bootstrap/swagger.bootstrap.spec.ts`

**Interfaces:**
- Produces:

```text
GET    /api/v1/users/me/cooking-history?limit=20
POST   /api/v1/users/me/cooking-history { recipeId, servings }
DELETE /api/v1/users/me/cooking-history/:historyId
DELETE /api/v1/users/me/cooking-history
```

- [ ] **Step 1: Write failing service/controller tests** for list newest-first, create existing recipe, missing recipe, limit bounds, delete ownership, clear ownership, and unauthenticated `401`.
- [ ] **Step 2: Run focused tests to verify failure**

```powershell
corepack pnpm@11.18.0 exec jest src/modules/cooking-history test/cooking-history.e2e-spec.ts --runInBand
```

- [ ] **Step 3: Implement repository queries and DTO validation**

The repository derives `userId` only from the service call and joins recipe card fields. The query list accepts `limit` between 1 and 50, default 20. The create service verifies recipe existence and clamps/validates servings with the same 1–24 rule used by planning.

- [ ] **Step 4: Implement controller guards and module registration**

Every route uses `JwtAuthGuard` and `@CurrentUser()`. Do not accept `userId` in query/body. Add Swagger response contracts and route inventory assertions.

- [ ] **Step 5: Run backend focused verification**

```powershell
corepack pnpm@11.18.0 exec jest src/modules/cooking-history test/cooking-history.e2e-spec.ts --runInBand
corepack pnpm@11.18.0 exec tsc -p tsconfig.json --noEmit
corepack pnpm@11.18.0 build
```

- [ ] **Step 6: Commit the backend module**

```powershell
git add src/backend/src/modules/cooking-history src/backend/test/cooking-history.e2e-spec.ts src/backend/src/app.module.ts src/backend/src/bootstrap/swagger.bootstrap.spec.ts
git commit -m "feat(history): add private cooking history API"
```

### Task 3: Add frontend API, query hooks, and page

**Files:**
- Create: `src/frontend/features/history/api/cookingHistoryApi.ts`
- Create: `src/frontend/features/history/api/cookingHistoryQueries.ts`
- Create: `src/frontend/features/history/api/cookingHistoryApi.test.ts`
- Create: `src/frontend/features/history/CookingHistoryPage.tsx`
- Create: `src/frontend/features/history/CookingHistoryPage.test.tsx`
- Modify: `src/frontend/shared/api/routes.js`
- Modify: `src/frontend/shared/api/contracts.ts`
- Modify: `src/frontend/app/AppRoutes.jsx`
- Modify: `src/frontend/features/profile/Profile.jsx`

- [ ] **Step 1: Write failing API/page tests** for exact endpoint methods, loading/empty/error, recipe card data, Cook again link, single delete, and clear confirmation.
- [ ] **Step 2: Run focused tests to verify failure**

```powershell
cd src/frontend
pnpm exec vitest run features/history/api/cookingHistoryApi.test.ts features/history/CookingHistoryPage.test.tsx
```

- [ ] **Step 3: Implement typed query/mutation hooks** using existing query-client invalidation and auth handling. Keep the list response under a single `cookingHistoryQueryKeys.all` family.
- [ ] **Step 4: Implement semantic history page** with a `ul`/`li` card list, recipe image fallback, date formatting, servings, unavailable recipe state, Cook again navigation, delete confirmation, and clear confirmation.
- [ ] **Step 5: Run focused tests/lint/typecheck**

```powershell
pnpm exec vitest run features/history
pnpm exec eslint features/history app/AppRoutes.jsx features/profile/Profile.jsx
pnpm exec tsc --noEmit
```

- [ ] **Step 6: Commit the history page**

```powershell
git add src/frontend/features/history src/frontend/shared/api/routes.js src/frontend/shared/api/contracts.ts src/frontend/app/AppRoutes.jsx src/frontend/features/profile/Profile.jsx
git commit -m "feat(history): add cooking history page"
```

### Task 4: Record completion from Cooking Mode

**Files:**
- Modify: `src/frontend/features/recipes/cooking/CookingMode.tsx`
- Modify: `src/frontend/features/recipes/Recipe.jsx`
- Modify: `src/frontend/features/recipes/cooking/CookingMode.guided-flow.test.jsx`
- Create: `src/frontend/features/recipes/cooking/CookingMode.history.test.jsx`

- [ ] **Step 1: Write failing completion tests** for authenticated mutation, guest no-op, one call per session, non-blocking mutation failure, and existing plan completion copy.
- [ ] **Step 2: Run focused tests to verify failure**

```powershell
pnpm exec vitest run features/recipes/cooking/CookingMode.guided-flow.test.jsx features/recipes/cooking/CookingMode.history.test.jsx
```

- [ ] **Step 3: Add an `onComplete` callback without moving auth into CookingMode**

```tsx
type CookingModeProps = {
  onComplete?: (input: { recipeId: number; servings: number }) => void;
};
```

Guard the callback with a ref/state so `Finish cooking` can only record once. `Recipe.jsx` passes the mutation only when authenticated; on mutation error it shows a non-blocking toast/status and still renders completion.

- [ ] **Step 4: Run focused cooking tests and accessibility checks**

```powershell
pnpm exec vitest run features/recipes/cooking
pnpm exec eslint features/recipes/cooking/CookingMode.tsx features/recipes/Recipe.jsx
```

- [ ] **Step 5: Commit completion recording**

```powershell
git add src/frontend/features/recipes/cooking/CookingMode.tsx src/frontend/features/recipes/Recipe.jsx src/frontend/features/recipes/cooking/CookingMode.guided-flow.test.jsx src/frontend/features/recipes/cooking/CookingMode.history.test.jsx
git commit -m "feat(history): record completed cooking sessions"
```

### Task 5: Verify the full history journey

**Files:**
- Create: `src/frontend/e2e/cooking-history-journey.spec.js`

- [ ] **Step 1: Add deterministic browser fixtures** for completing a recipe, POST history, GET history, Cook again, and DELETE clear.
- [ ] **Step 2: Run desktop/mobile E2E**

```powershell
pnpm test:e2e -- e2e/cooking-history-journey.spec.js
```

- [ ] **Step 3: Run package checks**

```powershell
cd src/backend; corepack pnpm@11.18.0 check; corepack pnpm@11.18.0 build
cd ../frontend; pnpm check; pnpm build
```

- [ ] **Step 4: Commit the journey**

```powershell
git add src/frontend/e2e/cooking-history-journey.spec.js
git commit -m "test(history): cover cooking history journey"
```
