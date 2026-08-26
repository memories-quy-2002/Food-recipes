# Frontend TypeScript Migration Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Migrate frontend application source and frontend unit/component tests to TypeScript/TSX in independently verified slices while preserving the existing Vite/React/TanStack Query architecture and behavior.

**Architecture:** Keep src/frontend and src/backend as independent packages. Convert frontend application files by dependency order, typing HTTP contracts before query consumers and component props before presentation logic. Keep Playwright E2E files, test-runner glue, and backend/tooling configuration in JavaScript where they do not materially improve application type-safety.

**Tech Stack:** TypeScript 5.9, Vite 8, React 19, React Router 7, TanStack Query 5, Axios, Zod, React Hook Form, Redux Toolkit, Vitest, Testing Library, ESLint 9 with typescript-eslint, and Playwright.

**Spec:** docs/superpowers/specs/2026-08-26-frontend-typescript-migration-design.md

## Global Constraints

- Run frontend commands from src/frontend and backend commands from src/backend; never run pnpm from the repository root.
- Preserve unrelated user changes and existing uncommitted files; never use git add ., git commit -a, git reset --hard, or git checkout --.
- The working branch is refactor/frontend-typescript-migration.
- Stage exact migration paths only. Before touching a path already modified in the worktree, inspect git diff -- path and keep unrelated hunks out of the migration commit; ask the user if the migration cannot be separated safely.
- Keep strict: true enabled throughout the migration.
- Do not add new application-code any, blanket @ts-ignore, empty catches, or broad unreviewed type assertions.
- Keep existing API routes, response envelopes, UI states, accessibility behavior, responsive behavior, ownership boundaries, and user-visible copy unchanged unless a type fix requires an equivalent expression.
- Keep JavaScript exceptions limited to src/frontend/e2e, test-runner/tooling glue, and documented support scripts.
- Use apply_patch for source edits. Use Conventional Commits with lower-case type/scope and a subject under the repository's commit-lint limit.
- Every commit must pass git diff --cached --check and the repository pre-commit backend typecheck hook; frontend checks are required at the task boundaries below.

---

### Task 1: Establish a green frontend baseline

**Files:**

- Modify: src/frontend/features/history/HistoryPage.test.tsx
- Read: src/frontend/features/history/HistoryPage.tsx
- Read: src/frontend/package.json

**Interfaces:**

- Consumes: replayHref(CookingResumeContext) and the existing formatDate helper.
- Produces: a frontend typecheck baseline with no excess-property error in the history replay fixtures.

- [ ] **Step 1: Run the baseline checks and capture current failures**

Run from src/frontend:

    pnpm typecheck
    pnpm lint
    pnpm test:ci
    pnpm build

Expected baseline fact: pnpm typecheck reports that the history test fixture passes fields not present in CookingResumeContext. Record any additional failure without changing unrelated files.

- [ ] **Step 2: Narrow the history fixtures to the helper input contract**

Keep only the fields consumed by replayHref:

    replayHref({
      recipe_id: 15,
      meal_plan_item_id: 42,
      planned_date: "2026-08-25T00:00:00.000Z",
      slot: "dinner",
      servings: 4,
    });

Apply the same shape to the unplanned fixture with nullable plan fields. Do not widen CookingResumeContext merely to accept test-only fields.

- [ ] **Step 3: Re-run the focused history test and frontend typecheck**

    pnpm exec vitest run features/history/HistoryPage.test.tsx
    pnpm typecheck

Expected: both commands pass. If another baseline failure remains, fix only a committed baseline defect directly required for this task and record it in the commit body.

- [ ] **Step 4: Commit the baseline correction**

Stage only src/frontend/features/history/HistoryPage.test.tsx, verify the staged diff, and commit:

    git add -- src/frontend/features/history/HistoryPage.test.tsx
    git diff --cached --check
    git diff --cached --name-only
    git commit -m "test(history): align replay fixture with context type"

The staged name list must contain only the history test.

---

### Task 2: Convert shared foundation and application bootstrap

**Files:**

- Modify: src/frontend/shared/api/axios.js -> src/frontend/shared/api/axios.ts
- Modify: src/frontend/shared/api/config.js -> src/frontend/shared/api/config.ts
- Modify: src/frontend/shared/api/mutations.js -> src/frontend/shared/api/mutations.ts
- Modify: src/frontend/shared/api/payload.js -> src/frontend/shared/api/payload.ts
- Modify: src/frontend/shared/api/routes.js -> src/frontend/shared/api/routes.ts
- Modify: src/frontend/shared/api/supabaseStorage.js -> src/frontend/shared/api/supabaseStorage.ts
- Modify: src/frontend/shared/utils/additionTime.js -> src/frontend/shared/utils/additionTime.ts
- Modify: src/frontend/shared/utils/convertImage.jsx -> src/frontend/shared/utils/convertImage.tsx
- Modify: src/frontend/shared/utils/convertTime.js -> src/frontend/shared/utils/convertTime.ts
- Modify: src/frontend/shared/utils/formatTimestamp.js -> src/frontend/shared/utils/formatTimestamp.ts
- Modify: src/frontend/shared/utils/ratingStar.jsx -> src/frontend/shared/utils/ratingStar.tsx
- Modify: src/frontend/shared/utils/siteContent.js -> src/frontend/shared/utils/siteContent.ts
- Modify: all current JSX modules under src/frontend/shared/ui/ except existing .d.ts files -> .tsx
- Modify: all current JSX/JS modules under src/frontend/shared/layout/ -> .tsx/.ts
- Modify: src/frontend/app/App.jsx -> src/frontend/app/App.tsx
- Modify: src/frontend/app/RecipeProvider.jsx -> src/frontend/app/RecipeProvider.tsx
- Modify: src/frontend/app/RecipeProvider.test.jsx -> src/frontend/app/RecipeProvider.test.tsx
- Modify: src/frontend/app/ToastProvider.jsx -> src/frontend/app/ToastProvider.tsx
- Modify: src/frontend/app/ToastProvider.test.jsx -> src/frontend/app/ToastProvider.test.tsx
- Modify: src/frontend/app/store.js -> src/frontend/app/store.ts
- Modify: src/frontend/main.jsx -> src/frontend/main.tsx
- Modify: shared foundation tests outside E2E from .js/.jsx to .ts/.tsx
- Delete: shared UI .d.ts files only after their declarations are represented in the converted source

**Interfaces:**

- Consumes: existing src/frontend/shared/api/contracts.ts, existing Axios behavior, existing UI class names, and existing component call sites.
- Produces: typed apiRoutes, ApiConfig, createApiClient, API payload serializers, RootState, AppDispatch, provider values, and shared component prop types.

- [ ] **Step 1: Record the exact shared foundation inventory and inspect dirty overlaps**

    rg --files shared app -g '*.js' -g '*.jsx' -g '*.ts' -g '*.tsx'
    git diff -- shared app main.jsx

For each path already modified before this task, separate the migration edit from the existing behavior edit. Do not overwrite or revert the existing diff.

- [ ] **Step 2: Type API configuration and route builders**

Use explicit primitives and a stable route type:

    export type ApiConfig = {
      target: "nest";
      baseURL: string;
    };

    type ApiEnvironment = {
      DEV?: boolean;
      VITE_API_BASE_URL?: string;
    };

    export const getApiConfig = (
      env: ApiEnvironment = import.meta.env,
    ): ApiConfig => {
      // Preserve the local fallback, validation message, and /api/v1 suffix.
    };

Type route function parameters as number | string where existing callers use both, and keep route strings equivalent.

- [ ] **Step 3: Type Axios auth refresh without changing retry behavior**

Use Axios types and a narrow retry extension:

    type RetriableRequestConfig = InternalAxiosRequestConfig & {
      __retried?: boolean;
    };

    export const createApiClient = (
      env: ApiEnvironment = import.meta.env,
    ): AxiosInstance => {
      // Preserve request interceptor, refreshPromise singleton,
      // auth:expired event, exclusions, and one-retry behavior.
    };

Use unknown for interceptor errors, narrow with axios.isAxiosError, and keep the rejected error object returned to callers.

- [ ] **Step 4: Type serializers, utilities, UI primitives, and providers**

Define local prop and input types instead of any:

    type RecipeCardProps = {
      recipe: RecipeSummary;
      className?: string;
      onSelect?: (recipe: RecipeSummary) => void;
    };

    type ToastType = "success" | "error" | "info" | "warning";

    type ToastOptions = {
      title?: string;
      message?: string;
      type?: ToastType;
      duration?: number;
    };

    type ToastContextValue = {
      showToast: (options?: string | ToastOptions) => string | undefined;
      dismissToast: (toastId: string) => void;
    };

Preserve default props, children behavior, events, classes, and return values. Reuse RecipeSummary, RecipeDetail, ApiErrorResponse, and catalog types.

- [ ] **Step 5: Type Redux store exports and update imports**

Expose typed store helpers without changing reducer shape:

    export type RootState = ReturnType<typeof store.getState>;
    export type AppDispatch = typeof store.dispatch;

Update imports to extensionless paths. Delete an old source file only after all imports resolve to its new TS/TSX path.

- [ ] **Step 6: Convert and run shared tests**

Rename tests based on syntax, preserve assertions, and run:

    pnpm exec vitest run shared app --exclude 'e2e/**'
    pnpm typecheck
    pnpm lint

- [ ] **Step 7: Commit the shared foundation slice**

Stage only shared/app/main conversion paths and tests, inspect the staged name list, then commit:

    git diff --cached --check
    git diff --cached --name-status
    git commit -m "refactor(frontend): type shared application foundation"

---

### Task 3: Convert authentication and route protection

**Files:**

- Modify: src/frontend/app/AuthProvider.jsx -> src/frontend/app/AuthProvider.tsx
- Modify: src/frontend/app/AppRoutes.jsx -> src/frontend/app/AppRoutes.tsx
- Modify: src/frontend/app/AppRoutes.recipe-edit.test.jsx -> src/frontend/app/AppRoutes.recipe-edit.test.tsx
- Modify: src/frontend/features/auth/Account.jsx -> Account.tsx
- Modify: src/frontend/features/auth/api/authSessionApi.js and test -> .ts
- Modify: src/frontend/features/auth/components/AccountForm.jsx and return-intent test -> .tsx
- Modify: src/frontend/features/auth/components/LoginForm.jsx -> .tsx
- Modify: src/frontend/features/auth/components/ProtectedRoute.jsx and test -> .tsx
- Modify: src/frontend/features/auth/components/SignupForm.jsx -> .tsx
- Modify: src/frontend/features/auth/hooks/useLoginForm.js -> useLoginForm.ts
- Modify: src/frontend/features/auth/hooks/useSignupForm.js -> useSignupForm.ts
- Modify: src/frontend/features/auth/returnIntent.js and test -> .ts
- Modify: src/frontend/features/auth/state/authSlice.jsx -> authSlice.ts
- Modify: src/frontend/features/auth/state/authTokenStore.js and test -> .ts
- Modify: remaining auth surface tests from .jsx/.js to .tsx/.ts

**Interfaces:**

- Consumes: typed store helpers, ApiErrorResponse, auth session responses, and existing route contracts.
- Produces: typed AuthContextValue, auth form values, protected-route children, and return-intent helpers.

- [ ] **Step 1: Type the session and token boundaries**

Define explicit session types and keep storage behavior unchanged:

    export type AuthUser = {
      user_id: number;
      full_name?: string | null;
      email?: string | null;
    };

    export type AuthSession = {
      user: AuthUser | null;
      token?: string | null;
    };

Use unknown for storage/API values until narrowed. Do not move tokens to a new storage mechanism.

- [ ] **Step 2: Type provider state and protected route states**

Type context defaults explicitly and preserve loading/authenticated/unauthenticated branches:

    type AuthState = {
      isAuthenticated: boolean;
      hydrated: boolean;
      user: AuthUser | null;
      userId: number;
      token: string | null;
    };

    type AuthContextValue = {
      auth: React.MutableRefObject<AuthState>;
    };

Keep redirect paths internal and preserve existing ProtectedRoute behavior.

- [ ] **Step 3: Type form fields and DOM events**

Use React Hook Form/Zod inferred types where schemas exist:

    const handleSubmit = (
      event: React.FormEvent<HTMLFormElement>,
    ): void => {
      event.preventDefault();
    };

Preserve validation messages, password visibility, return-intent handling, focus behavior, and pending states.

- [ ] **Step 4: Convert auth tests and run focused checks**

    pnpm exec vitest run app features/auth
    pnpm typecheck
    pnpm lint

- [ ] **Step 5: Commit the authentication slice**

Stage only auth/app route files and tests, inspect the staged paths, and commit:

    git commit -m "refactor(auth): type frontend authentication flow"

---

### Task 4: Convert Home, Food, and search features

**Files:**

- Modify: all current .jsx/.js files under src/frontend/features/home/ -> .tsx/.ts
- Modify: all current .jsx/.js files under src/frontend/features/food/ -> .tsx/.ts
- Modify: their .test.jsx/.test.js files -> .test.tsx/.test.ts
- Read: src/frontend/features/home/api/useHomeFeedQuery.ts
- Read: src/frontend/features/home/main/api/useHomeSearchQuery.ts
- Read: src/frontend/features/food/api/useRecipesQuery.ts

**Interfaces:**

- Consumes: RecipeSummary, HomeFeedResponse, query results, catalog item types, and shared UI props.
- Produces: typed home/food props, filter state, pagination state, carousel callbacks, and search inputs.

- [ ] **Step 1: Inventory Home/Food props and query shapes**

    rg -n "function |const .* = \\(|useState|useMemo|useCallback|map\\(|response\\.data|on[A-Z]" features/home features/food

Create local prop types beside each component. Reuse API contracts instead of typing query results as object or unknown after the API function has a concrete return type.

- [ ] **Step 2: Convert query consumers before presentation details**

Preserve the existing TanStack Query states:

    const recipes = query.data?.recipes ?? [];

    if (query.isPending) return <PageState title="Loading recipes" />;
    if (query.isError) return <PageState type="error" />;
    return <RecipeGrid recipes={recipes} />;

Type filter values, pagination callbacks, search input events, and carousel data without changing URL/query serialization.

- [ ] **Step 3: Convert Home/Food tests**

Keep accessibility, keyboard, sorting, favorite, pagination, and server-search assertions unchanged except for typed fixtures. Use satisfies for fixtures where it improves excess-property detection.

- [ ] **Step 4: Run focused checks and commit**

    pnpm exec vitest run features/home features/food
    pnpm typecheck
    pnpm lint
    pnpm build
    git commit -m "refactor(discovery): type home and food features"

Stage only this slice before the commit.

---

### Task 5: Convert recipe detail and recipe-adjacent read surfaces

**Files:**

- Modify: src/frontend/features/recipes/Recipe.jsx -> Recipe.tsx
- Modify: src/frontend/features/recipes/RecipeContent.jsx -> RecipeContent.tsx
- Modify: src/frontend/features/recipes/RecipeContainerSummary.jsx -> RecipeContainerSummary.tsx
- Modify: src/frontend/features/recipes/RecipeOtherList.jsx -> RecipeOtherList.tsx
- Modify: src/frontend/features/recipes/RecipeMetadataPanel.jsx -> RecipeMetadataPanel.tsx
- Modify: src/frontend/features/recipes/RecentlyViewedRecipes.jsx -> RecentlyViewedRecipes.tsx
- Modify: all current JSX/JS files under src/frontend/features/recipes/content/ -> .tsx/.ts
- Modify: src/frontend/features/recipes/share/ShareRecipeButton.jsx, PrintRecipeButton.jsx, recipeSharing.js and tests -> .tsx/.ts
- Modify: src/frontend/features/recipes/notes/PrivateRecipeNotes.jsx and test -> .tsx
- Modify: recipe detail, print, share, metadata, content, notes, and recently-viewed tests outside E2E -> .tsx/.ts

**Interfaces:**

- Consumes: RecipeDetail, RecipeMetadata, structured ingredient types, notes query/mutation APIs, typed shared UI, and route query parsing.
- Produces: typed recipe detail props, ingredient/rating/review props, share/print callbacks, and metadata rendering inputs.

- [ ] **Step 1: Establish the recipe view model at the route boundary**

Use the existing contract and keep nullable fields explicit:

    type RecipeViewProps = {
      recipe: RecipeDetail;
      isLoading?: boolean;
      onRetry?: () => void;
    };

Do not make optional API fields required through non-null assertions; preserve absent-data states.

- [ ] **Step 2: Type ingredient, rating, review, metadata, share, and print props**

    type RecipeIngredientListProps = {
      ingredients: string[];
      structuredIngredients?: StructuredIngredient[] | null;
    };

Keep print behavior, Web Share fallback, clipboard error behavior, provenance labels, and link targets unchanged.

- [ ] **Step 3: Type browser APIs and route parameters**

Narrow optional browser APIs before use:

    if (navigator.share) {
      await navigator.share({ title, url });
    } else {
      await navigator.clipboard.writeText(url);
    }

Keep same-origin URL construction and existing error feedback. Parse id from URLSearchParams before passing it to typed query functions.

- [ ] **Step 4: Convert focused tests and run recipe checks**

    pnpm exec vitest run features/recipes --exclude 'features/recipes/RecipeEditor*' --exclude 'features/recipes/AddRecipe*' --exclude 'features/recipes/EditRecipe*'
    pnpm typecheck
    pnpm lint
    pnpm build

- [ ] **Step 5: Commit the recipe read-surface slice**

    git commit -m "refactor(recipes): type recipe read surfaces"

Stage only the recipe read-surface paths and tests.

---

### Task 6: Convert saved, wishlist, profile, suggestions, and content surfaces

**Files:**

- Modify: all current .jsx/.js files under src/frontend/features/saved/ -> .tsx/.ts
- Modify: all current .jsx/.js files under src/frontend/features/wishlist/ -> .tsx/.ts
- Modify: all current .jsx/.js files under src/frontend/features/profile/ -> .tsx/.ts
- Modify: src/frontend/features/suggestions/SuggestionPanel.jsx -> SuggestionPanel.tsx
- Modify: src/frontend/features/suggestions/SuggestionPanel.test.jsx -> SuggestionPanel.test.tsx
- Modify: src/frontend/features/content/ErrorPage.jsx -> ErrorPage.tsx
- Modify: current unit/component tests in these feature directories -> .tsx/.ts

**Interfaces:**

- Consumes: collection, wishlist, profile, rating, suggestion, and API error contracts; typed navigation and shared UI.
- Produces: typed list item props, dialog state, profile form state, suggestion response props, and error-page props.

- [ ] **Step 1: Type collection, wishlist, profile, and suggestion API consumers**

Declare response arrays and mutation callbacks explicitly:

    type CollectionRecipeDialogProps = {
      collectionId: number;
      recipeId?: number;
      onClose: () => void;
    };

Preserve ownership-sensitive routes, pending states, delete confirmations, saved timestamps, and empty states.

- [ ] **Step 2: Type profile forms and derived display values**

Use explicit nullable user/profile fields, React.ChangeEvent<HTMLInputElement>, React.FormEvent<HTMLFormElement>, and a typed error normalizer. Keep password form behavior and validation copy unchanged.

- [ ] **Step 3: Convert all focused tests**

Convert render tests to .tsx and pure helper/API tests to .ts. Preserve sorting, accessibility, remove, dialog, saved timestamp, and suggestion fallback assertions.

- [ ] **Step 4: Run focused checks and commit**

    pnpm exec vitest run features/saved features/wishlist features/profile features/suggestions features/content
    pnpm typecheck
    pnpm lint
    pnpm build
    git commit -m "refactor(account): type saved and profile surfaces"

Stage only the saved/wishlist/profile/suggestions/content paths.

---

### Task 7: Convert recipe creation, editing, cooking support, and remaining application JavaScript

**Files:**

- Modify: src/frontend/features/recipes/AddRecipe.jsx -> AddRecipe.tsx
- Modify: src/frontend/features/recipes/EditRecipe.jsx -> EditRecipe.tsx
- Modify: src/frontend/features/recipes/RecipeEditor.jsx -> RecipeEditor.tsx
- Modify: src/frontend/features/recipes/recipeDraftStorage.js and test -> .ts
- Modify: src/frontend/features/recipes/cooking/ManualTimer.jsx and test -> .tsx
- Modify: src/frontend/features/recipes/cooking/useCookingMode.js -> useCookingMode.ts
- Modify: src/frontend/features/recipes/cooking/useCookingSession.js -> useCookingSession.ts
- Modify: src/frontend/features/recipes/cooking/CookingMode.guided-flow.test.jsx -> .test.tsx
- Read: existing TypeScript modules under src/frontend/features/planning/, pantry/, shopping/, and history/
- Modify: any remaining application .js/.jsx under app, features, or shared discovered by the inventory command

**Interfaces:**

- Consumes: recipeForm.schema.ts, recipeEditorApi.ts, editRecipeApi.ts, structuredIngredients.ts, existing planning/shopping/pantry/history contracts, and typed form components.
- Produces: typed recipe form values, draft storage records, editor mutation payloads, cooking timer/session state, and callback contracts.

- [ ] **Step 1: Type the recipe form model from the existing schema**

Use the schema as the source for form values:

    type RecipeFormValues = z.infer<typeof recipeFormSchema>;

    type RecipeEditorMode = "create" | "edit";

    type RecipeEditorSaveResult = {
      recipe: Pick<RecipeDetail, "recipe_id"> & Partial<RecipeDetail>;
      mode: RecipeEditorMode;
    };

    type RecipeEditorProps = {
      mode: RecipeEditorMode;
      recipeId?: number | null;
      initialRecipe?: RecipeEditorValue | null;
      onSaved?: (result: RecipeEditorSaveResult) => void;
    };

Keep draft-only fields, free-text ingredient quantities, image upload state, publish/archive actions, and owner-only edit behavior unchanged.

- [ ] **Step 2: Type draft storage and API payload conversion**

Define the persisted draft as a serializable type:

    type StoredRecipeDraft = {
      recipeName?: string;
      recipeDescription?: string;
      recipeIngredients?: string[];
      recipeInstructions?: string[];
      updatedAt: string;
    };

Keep quantity_text, original_text, and unit_text normalization at the existing API/editor boundary. Do not infer numeric ingredient safety from free-text values.

- [ ] **Step 3: Type cooking timer and session hooks**

Use explicit hook return types and timer refs:

    type CookingModeResult = {
      stepIndex: number;
      isFirstStep: boolean;
      isLastStep: boolean;
      goToPrevious: () => void;
      goToNext: () => void;
      handleFinish: () => Promise<void>;
    };

Type useRef<number | null>, keyboard event handlers, optional completion callbacks, and session mutation state without changing duplicate-submit protection or completion UX.

- [ ] **Step 4: Convert form/editor/cooking tests**

Convert JSX tests to .tsx and pure draft/helper tests to .ts. Keep validation, draft isolation, owner edit, print, guided-flow, timer, and save-error assertions unchanged.

- [ ] **Step 5: Confirm no application JavaScript remains before final cleanup**

    rg --files src/frontend/app src/frontend/features src/frontend/shared -g '*.js' -g '*.jsx'
    rg --files -g '*.test.js' -g '*.test.jsx' | Where-Object { $_ -notmatch '[\\\\/]e2e[\\\\/]' }

Expected: no output. Convert every listed application/test path and rerun the inventory. E2E files are intentionally excluded.

- [ ] **Step 6: Run stateful feature checks and commit**

    pnpm exec vitest run features/recipes
    pnpm typecheck
    pnpm lint
    pnpm build
    git commit -m "refactor(recipes): type recipe editing and cooking flows"

---

### Task 8: Finish compiler, lint, CI, and allowed-JavaScript policy

**Files:**

- Modify: src/frontend/tsconfig.json
- Delete: src/frontend/jsconfig.json
- Modify: src/frontend/eslint.config.mjs
- Modify: src/frontend/package.json
- Modify: .github/workflows/quality-gates.yml
- Create: src/frontend/tools/assert-application-typescript.mjs
- Read: src/frontend/e2e/playwright.config.js and all files under src/frontend/e2e/

**Interfaces:**

- Consumes: the fully converted frontend application program and existing E2E/tooling exception paths.
- Produces: a strict TypeScript-only application source check and typed-lint/test/build gate.

- [ ] **Step 1: Disable JavaScript in the frontend TypeScript project**

Update src/frontend/tsconfig.json so final compiler options include:

    {
      "compilerOptions": {
        "noEmit": true,
        "strict": true,
        "allowJs": false,
        "checkJs": false
      }
    }

Keep existing Vite/React module, JSX, alias, target, and skipLibCheck settings. Remove jsconfig.json after all alias consumers resolve through tsconfig.json.

- [ ] **Step 2: Add the application-source JavaScript guard**

Create src/frontend/tools/assert-application-typescript.mjs. It scans only app, features, shared, and main.js/jsx, fails with each offending path, sorts paths, and exits 0 only when no application JavaScript exists.

The script must not scan e2e, node_modules, dist, coverage, or tooling files. The allowed roots are explicit in the source:

    const applicationRoots = ["app", "features", "shared"];
    const disallowedExtensions = new Set([".js", ".jsx"]);

- [ ] **Step 3: Wire the guard into package scripts and CI**

Add this package script:

    "check:application-typescript": "node tools/assert-application-typescript.mjs"

Include it in the normal frontend check and make quality-gates.yml run the frontend check from src/frontend. Do not change the existing E2E command.

- [ ] **Step 4: Enable typed ESLint for migrated source**

Configure the existing typescript-eslint flat config for application TypeScript files with parserOptions.projectService: true and re-enable unused-variable checks:

    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { "argsIgnorePattern": "^_" }
      ]
    }

Keep the E2E/tooling exception explicit rather than disabling rules globally.

- [ ] **Step 5: Remove redundant declarations and stale imports**

Delete only sidecar .d.ts files represented in source. Search for stale application references:

    rg -n --glob '*.{ts,tsx}' '\\.(js|jsx)' src/frontend/app src/frontend/features src/frontend/shared

Expected: no application import uses a JavaScript extension.

- [ ] **Step 6: Run final frontend checks and commit the configuration slice**

    pnpm run check:application-typescript
    pnpm lint
    pnpm typecheck
    pnpm test:ci
    pnpm build
    git commit -m "chore(frontend): enforce TypeScript application source"

---

### Task 9: Run full regression verification and review commit hygiene

**Files:**

- Read: all migration commits on refactor/frontend-typescript-migration
- Read: src/frontend/e2e/*.js and src/frontend/e2e/playwright.config.js
- Read: src/backend/tsconfig.json, src/backend/package.json, and backend Git hooks
- Modify: no source files unless verification identifies a migration regression

**Interfaces:**

- Consumes: completed frontend TypeScript application and unchanged backend/E2E contracts.
- Produces: verified migration branch with scoped commits and documented environment limitations.

- [ ] **Step 1: Run complete frontend verification**

From src/frontend:

    pnpm check
    pnpm build
    pnpm test:e2e:ci

If Playwright web server or Chromium cannot start on Windows, use the manual preview procedure, execute reachable journey checks, and record the exact blocked command instead of reporting a false pass.

- [ ] **Step 2: Run backend regression checks**

From src/backend:

    pnpm check
    pnpm build
    pnpm prisma:validate

The migration must not modify backend behavior or Prisma schema. Report database-dependent E2E limitations separately from TypeScript results.

- [ ] **Step 3: Verify application JavaScript policy and test coverage**

Run from src/frontend:

    pnpm run check:application-typescript
    rg --files -g '*.test.js' -g '*.test.jsx' | Where-Object { $_ -notmatch '[\\\\/]e2e[\\\\/]' }

Run from the repository root for the committed migration range:

    git diff --check master..HEAD

Expected: the guard passes, the non-E2E test search returns no files, and the committed migration range has no whitespace errors. E2E JavaScript remains allowed by the spec.

- [ ] **Step 4: Inspect every committed path and branch state**

    git log --oneline --decorate master..HEAD
    git status --short --branch
    git diff master..HEAD --stat

Confirm migration commits contain only spec/plan/migration files and unrelated pre-existing worktree changes remain unstaged and uncommitted. Do not push or create a pull request until the user explicitly requests that release step.
