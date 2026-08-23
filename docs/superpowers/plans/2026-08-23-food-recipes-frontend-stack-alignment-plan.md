# Food Recipes Frontend Stack Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the requested frontend-owned technologies to Food Recipes while preserving the current Express fallback and keeping NestJS/OpenAPI/JWT-RBAC/Prisma/PostgreSQL behind the REST API boundary.

**Architecture:** Keep the existing React 19 + Vite application and migrate incrementally. TypeScript will own new shared contracts and configuration first, TanStack Query will own server-state fetching/cache invalidation, and React Hook Form + Zod will own the recipe editor form boundary. The browser will select either the legacy Express API or the NestJS API through Kong using public `VITE_*` configuration only.

**Tech Stack:** React 19, TypeScript, Vite, TanStack Query v5, React Hook Form, Zod, Axios, REST/OpenAPI-compatible API routes, Playwright, Vitest, GitHub Actions, Vercel.

## Global Constraints

- Frontend: **React + TypeScript + Vite** — new shared API/config code must be TypeScript-checked; do not rewrite unrelated legacy JSX in this change.
- Server state: **TanStack Query** — use object signatures and targeted invalidation; do not add another manual global server cache.
- Forms: **React Hook Form + Zod** — the recipe editor publish submit must use `useForm`, `zodResolver`, and typed schema validation.
- Backend: **NestJS + TypeScript** and API: **REST + OpenAPI/Swagger** — consume the existing `/api/v1` route contract through the API client; do not import backend code into the frontend.
- Auth: **JWT + Refresh Token + RBAC** — forward the current access JWT only through the existing Nest client boundary; do not invent a refresh endpoint or treat UI route guards as backend authorization.
- Testing: **Jest + Supertest** remain backend-owned; frontend changes use Vitest and Playwright.
- Container/deployment: **Docker + Docker Compose**, **Vercel**, and **Kong** remain runtime/infrastructure boundaries; document the frontend variables and commands without adding database access to the browser.
- Preserve unrelated dirty work, ignored SDD reports, backend files, generated output, and existing API fallback behavior.
- Never put secrets, database URLs, JWT signing keys, refresh tokens, or service-role credentials in `VITE_*` variables.

---

### Task 1: Add the TypeScript/Vite/API contract boundary

**Files:**
- Create: `tsconfig.json`
- Create: `src/vite-env.d.ts`
- Create: `src/frontend/shared/api/contracts.ts`
- Create: `.env.example`
- Modify: `package.json`
- Modify: `src/frontend/features/food/api/useRecipesQuery.ts`
- Test: `src/frontend/features/food/api/useRecipesQuery.test.ts`

**Interfaces:**
- `RecipeSummary` is the shared frontend recipe-list shape used by `useRecipesQuery`.
- `CatalogItem` is the shared `{ id: number; name: string }` shape for public category/meal options.
- `ImportMetaEnv` declares `VITE_API_TARGET`, `VITE_API_BASE_URL`, `VITE_KONG_BASE_URL`, `VITE_SITE_URL`, and the public Supabase upload variables as optional strings.
- `pnpm typecheck` runs `tsc -p tsconfig.json --noEmit` with JavaScript allowed but not checked, so the migration is incremental.

- [ ] **Step 1: Add the TypeScript compiler boundary**

Create `tsconfig.json` with `allowJs: true`, `checkJs: false`, `noEmit: true`, `module: "ESNext"`, `moduleResolution: "Bundler"`, `jsx: "react-jsx"`, `strict: true`, the existing `@/*` path, and includes for `src`, `vite.config.ts`, and `src/vite-env.d.ts`.

- [ ] **Step 2: Declare only public Vite variables**

Create `src/vite-env.d.ts` with `/// <reference types="vite/client" />` and an `ImportMetaEnv` augmentation for the listed optional `VITE_*` variables. Do not declare database or signing-key variables.

- [ ] **Step 3: Define and consume recipe API types**

Create `contracts.ts` with `CatalogItem`, `RecipeSummary`, `RecipeDetail`, `RecipeListResponse`, and `ApiErrorResponse` types. Update `useRecipesQuery.ts` so its query returns `RecipeSummary[]` and its query key/request state remain unchanged.

- [ ] **Step 4: Add safe environment documentation and a typecheck script**

Add `.env.example` with non-secret local defaults:

```env
VITE_API_TARGET=legacy
VITE_API_BASE_URL=http://localhost:4000
VITE_KONG_BASE_URL=http://localhost:8000
VITE_SITE_URL=http://localhost:5173
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SUPABASE_RECIPE_BUCKET=recipe-images
```

Add `"typecheck": "tsc -p tsconfig.json --noEmit"` to `package.json` without changing existing scripts.

- [ ] **Step 5: Verify and commit**

Run `corepack pnpm typecheck`, `corepack pnpm vitest run src/frontend/features/food/api/useRecipesQuery.test.ts`, and `git diff --check`; expected result is a passing typecheck, passing focused tests, and no whitespace errors. Commit with `feat(web): add typed frontend api boundary`.

---

### Task 2: Migrate the recipe editor to React Hook Form and Zod

**Files:**
- Create: `src/frontend/features/recipes/recipeForm.schema.ts`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `src/frontend/features/recipes/AddRecipe.jsx`
- Modify: `src/frontend/features/recipes/recipeDraftStorage.js`
- Test: `src/frontend/features/recipes/recipeForm.schema.test.ts`
- Test: `src/frontend/features/recipes/AddRecipe.validation.test.jsx`
- Test: `src/frontend/features/recipes/AddRecipe.draft-isolation.test.jsx`

**Interfaces:**
- `recipeFormSchema` validates recipe name, supported taxonomy, one meaningful ingredient, one meaningful instruction, positive duration fields, and publish-only image requirements.
- `RecipeFormValues` is inferred from the Zod schema.
- Draft persistence remains local and account-scoped; `recipeImage` is never serialized.

- [ ] **Step 1: Add the form dependencies**

Add `react-hook-form`, `@hookform/resolvers`, and `zod` to the root frontend dependencies using the existing pnpm workspace and preserve the lockfile’s unrelated entries.

- [ ] **Step 2: Define the publish schema**

Use `z.object` and `zodResolver` to validate the editor values. Use `z.input<typeof recipeFormSchema>` / `z.output<typeof recipeFormSchema>` where coercion is needed for numeric time inputs. Dynamic category and meal options must be validated against the loaded lists; arbitrary `Other` values remain invalid.

- [ ] **Step 3: Make `useForm` the editor submit boundary**

Initialize `useForm` with the existing initial recipe values, pass `resolver: zodResolver(...)`, submit through `handleSubmit`, and map field errors into the existing accessible alert/copy. Keep file preview/upload state local, keep draft autosave account-isolated, and call `reset` when restoring or discarding a draft.

- [ ] **Step 4: Preserve existing editor behavior**

The editor must continue to support dynamic ingredient/instruction rows, paste-to-split, positive duration controls, optional image for drafts, required valid image for publish, explicit draft save/discard, and the existing Nest/legacy payload serializer.

- [ ] **Step 5: Add focused validation and restore coverage**

Cover the schema’s one-ingredient/one-instruction rule, taxonomy rejection, positive duration rule, publish-only image rule, and account-isolated draft restore. Keep existing user-facing messages stable unless a field-level message is required for accessibility.

- [ ] **Step 6: Verify and commit**

Run the focused AddRecipe/schema tests, `corepack pnpm typecheck`, `corepack pnpm build`, and `git diff --check`; expected result is all passing. Commit with `feat(web): validate recipe forms with react hook form`.

---

### Task 3: Move the shared recipe cache onto TanStack Query

**Files:**
- Create: `src/frontend/features/recipes/api/useRecipeQueries.ts`
- Modify: `src/frontend/app/RecipeProvider.jsx`
- Modify: `src/frontend/app/App.jsx`
- Modify: `src/frontend/features/recipes/AddRecipe.jsx`
- Modify: `src/frontend/features/home/HomeMain.jsx`
- Modify: `src/frontend/features/wishlist/Wishlist.jsx`
- Modify: `src/frontend/features/recipes/RecipeOtherList.jsx`
- Test: `src/frontend/app/RecipeProvider.test.jsx`
- Test: `src/frontend/features/recipes/api/useRecipeQueries.test.ts`

**Interfaces:**
- `recipeQueryKeys.all` is `readonly ["recipes"]`.
- `recipeQueryKeys.list()` is `readonly ["recipes", "list"]`.
- `recipeQueryKeys.detail(recipeId)` is `readonly ["recipes", "detail", string]`.
- `useAllRecipesQuery()` returns the normalized array used by current home/wishlist/related-recipe consumers.
- `refreshRecipes()` remains a compatibility function but invalidates `recipeQueryKeys.list()` instead of issuing a separate manual fetch.

- [ ] **Step 1: Extract stable query keys and fetchers**

Create `useRecipeQueries.ts` with the keys above and typed `useAllRecipesQuery`/`useRecipeQuery` hooks using the existing Axios client, route helpers, and payload normalization.

- [ ] **Step 2: Replace `RecipeProvider`’s manual effect**

Use the query hook under the existing `QueryClientProvider`; expose the existing context fields from query state so current consumers remain compatible while duplicate manual fetch state disappears.

- [ ] **Step 3: Invalidate after recipe creation**

After a successful publish, invalidate the list and relevant detail queries with TanStack Query v5 object signatures. Keep the legacy `refreshRecipes` compatibility call only as a thin cache invalidation wrapper.

- [ ] **Step 4: Preserve user/session state boundaries**

Do not move Redux auth/session state into TanStack Query. Do not cache access tokens, refresh tokens, or role decisions in query data. Keep Nest ownership and unsupported-route checks in the existing API route layer.

- [ ] **Step 5: Verify and commit**

Run focused query/provider tests, the existing Home/Wishlist/Recipe tests, `corepack pnpm typecheck`, and `corepack pnpm build`; expected result is passing tests/build and no duplicate provider fetch. Commit with `refactor(web): manage recipe server state with tanstack query`.

---

### Task 4: Make frontend verification and deployment stack explicit

**Files:**
- Modify: `package.json`
- Modify: `.github/workflows/quality-gates.yml`
- Modify: `playwright.config.js`
- Modify: `README.md`
- Modify: `vercel.json`
- Test: existing `e2e/current-user-journeys.spec.js`

**Interfaces:**
- `pnpm test:ci` runs the frontend Vitest suite once.
- `pnpm test:e2e:ci` runs Playwright against the Vite preview server.
- CI uses the same pinned pnpm version and installs Chromium explicitly.
- Vercel serves the Vite SPA with the existing rewrite and uses only public `VITE_*` build variables.

- [ ] **Step 1: Add deterministic frontend scripts**

Add `test:ci` as `vitest run` and `test:e2e:ci` as `playwright test`; preserve interactive `test` and `test:e2e` scripts.

- [ ] **Step 2: Add frontend CI gates**

Extend the existing frontend workflow job to run `pnpm typecheck`, `pnpm test:ci`, and `pnpm build`. Add a dependent Playwright job that installs Chromium and runs `pnpm test:e2e:ci` against the existing preview web server.

- [ ] **Step 3: Document runtime boundaries**

Update README with the frontend stack, Nest/Kong opt-in (`VITE_API_TARGET=nest`, `VITE_KONG_BASE_URL`), local fallback, safe environment-variable rules, and the commands for typecheck/unit/E2E/build. State explicitly that PostgreSQL/Prisma/Docker/JWT refresh/RBAC enforcement are backend or infrastructure responsibilities.

- [ ] **Step 4: Verify and commit**

Run `corepack pnpm typecheck`, `corepack pnpm test:ci`, `corepack pnpm build`, `corepack pnpm test:e2e:ci`, and `git diff --check`; expected result is passing commands. Commit with `ci(web): enforce frontend stack quality gates`.

---

## Final self-review checklist

- [ ] All frontend-owned requirements in the user technology table have a source change and a verification command.
- [ ] No browser code imports Prisma, PostgreSQL drivers, Nest modules, or JWT signing/refresh secrets.
- [ ] Legacy Express mode remains the default and unsupported Nest routes remain explicit.
- [ ] TypeScript errors, form validation, query invalidation, Playwright flows, CI configuration, and Vercel SPA rewrites are all covered.
- [ ] The original product plan remains unchanged; this document is only its frontend stack-alignment execution addendum.
