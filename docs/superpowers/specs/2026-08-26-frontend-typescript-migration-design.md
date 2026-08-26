# Frontend TypeScript Migration Design

**Date:** 2026-08-26
**Status:** Ready for user review

## Goal

Migrate the Food Recipes frontend application and its unit/component tests from JavaScript/JSX to TypeScript/TSX in incremental, independently verifiable slices. Preserve the current Vite/React/TanStack Query architecture, API behavior, UI behavior, accessibility behavior, and feature boundaries.

The backend application remains TypeScript and is not rewritten as part of this migration.

## Current state

- `src/frontend` contains an incremental JS/TS migration: 44 `.js`, 146 `.jsx`, 53 `.ts`, and 22 `.tsx` files.
- Frontend application source still contains approximately 23 `.js` and 86 `.jsx` files; existing TypeScript examples include planning, pantry, shopping, cooking, API modules, and shared contracts.
- `src/frontend/tsconfig.json` already has `strict: true`, but also has `allowJs: true`, `checkJs: false`, and includes only TypeScript source patterns. JavaScript is therefore not receiving equivalent TypeScript checking.
- `src/backend` application and test source is already TypeScript. Backend validation scripts and tool configuration may remain `.mjs`/`.cjs`.
- The current frontend typecheck is not green: `features/history/HistoryPage.test.tsx` passes `history_id` to `CookingResumeContext`, which does not declare that property. This baseline issue must be isolated or fixed before migration results are considered reliable.
- The worktree currently contains unrelated modified and untracked files. Migration work must be isolated from those changes and must not stage, delete, or commit them.

## Approved scope

### Included

- Frontend application code under `src/frontend/app`, `src/frontend/features`, and `src/frontend/shared`.
- The frontend entrypoint `src/frontend/main.jsx`.
- Frontend unit and component tests outside `src/frontend/e2e`.
- Type definitions for API contracts, query functions, mutation payloads, component props, hooks, form state, route parameters, and error states.
- TypeScript configuration, ESLint configuration needed to type-check the migrated source, and CI guards for the application source.
- Removal of redundant declaration sidecars when their component source becomes TypeScript.

### Explicitly allowed to remain JavaScript

- Playwright E2E specs and fixtures under `src/frontend/e2e` when converting them would not improve application type-safety.
- Playwright configuration and other test-runner glue that is already correctly supported as JavaScript.
- ESLint, Commitlint, and other tool configuration that is more stable in `.mjs`/`.cjs` for the current toolchain.
- Backend validation scripts under `src/backend/test` and `src/backend/commitlint.config.cjs`.
- Root-level or legacy test files that are proven not to be part of the frontend package's application or unit-test execution path.

JavaScript must not be added to the migrated application source or to new unit/component tests.

## Non-goals

- No frontend framework, bundler, state-management, router, styling, or API-client replacement.
- No backend rewrite, Prisma type sharing, or new workspace/package solely for this migration.
- No broad feature refactor, UI redesign, endpoint redesign, or database change.
- No automatic conversion of every JavaScript tooling file merely to reach zero `.js` files.
- No suppression-driven migration using blanket `any`, `@ts-ignore`, or large unreviewed type assertions.

## Design

### 1. Preserve package boundaries

The repository continues to use two independent packages:

```text
src/frontend  Vite + React + TanStack Query
src/backend   NestJS + Prisma
```

Frontend types must describe the HTTP contract consumed by the browser. They must not import Prisma-generated types or backend implementation types. Shared frontend contracts remain in `src/frontend/shared/api/contracts.ts`; feature-only types stay next to the feature API or component that owns them.

### 2. Classify files by syntax and responsibility

- A file that contains JSX becomes `.tsx`.
- A utility, API module, hook, store, or configuration module without JSX becomes `.ts`.
- A test that renders JSX becomes `.test.tsx`.
- A pure unit test becomes `.test.ts`.
- Existing `.d.ts` sidecars are removed when their declarations can live in the converted `.tsx` source.

The migration changes types and file extensions together. A mechanical rename without typed props, state, event handlers, refs, query results, and mutation payloads is not considered complete.

### 3. Type data at the application boundaries

The target data flow is:

```text
HTTP response
  -> typed API function: Promise<Contract>
  -> TanStack Query or local state
  -> typed component props
  -> rendered UI
```

Requirements:

- API functions declare concrete request and response types.
- External response data is treated as untrusted at runtime; Zod validation is used where an endpoint is dynamic, security-sensitive, or otherwise needs runtime protection.
- Axios and fetch errors enter the UI as `unknown`, then pass through a small normalizer that produces `ApiErrorResponse` or a safe fallback message.
- Route query parameters remain strings until explicitly parsed and validated.
- Form schemas continue to use the existing Zod/React Hook Form integration.
- Component props, callbacks, DOM events, refs, and state are explicitly typed.

### 4. Migration waves

Each wave must leave the package buildable and must carry its focused tests.

#### Wave 0: Baseline and isolation

- Record frontend typecheck, lint, unit-test, build, and relevant E2E results.
- Resolve or explicitly isolate the existing `HistoryPage.test.tsx` typecheck failure.
- Create a migration branch or checkpoint without including unrelated dirty files.
- Record the allowed JavaScript locations so the final CI guard has an explicit policy.

#### Wave 1: Shared foundation and application bootstrap

Convert the shared API/config modules, shared utilities, UI primitives, layout, providers, Redux store, route bootstrap, and entrypoint. The main areas are:

- `src/frontend/shared/api`
- `src/frontend/shared/utils`
- `src/frontend/shared/ui`
- `src/frontend/shared/layout`
- `src/frontend/app`
- `src/frontend/main.jsx`

This wave establishes reusable API contracts, typed provider values, typed store state, and typed component props for later features.

#### Wave 2: Authentication and routing

Convert authentication API/state modules, auth hooks, login/signup/account forms, `ProtectedRoute`, return-intent handling, and their unit/component tests. Preserve the existing session, redirect, unauthorized, loading, and form-error behavior.

#### Wave 3: Read-heavy product features

Convert Home, Food/search, recipe detail, wishlist, saved collections, profile, reviews, and their unit/component tests. Type query data before typing presentation components, and preserve current loading, empty, error, pagination, responsive, and accessibility states.

#### Wave 4: Stateful and form-heavy features

Convert recipe creation/editing, structured ingredients, planning, shopping list, pantry, cooking mode, and history. Use the already converted TypeScript modules in planning, pantry, shopping, cooking, history, and API contracts as local patterns. Preserve form validation, ownership-related UI states, mutation feedback, duplicate-submit protection, and route handoffs.

#### Wave 5: Final test and configuration cleanup

- Convert any remaining frontend unit/component tests outside E2E.
- Remove redundant `.d.ts` files and stale JavaScript imports.
- Set `allowJs: false` and remove `jsconfig.json` after the application source is converted.
- Add the application-source JavaScript guard to CI.
- Re-enable unused-variable checks and enable type-aware ESLint after the program is fully TypeScript.

### 5. Compiler and lint policy

During migration, the normal frontend `tsconfig.json` may continue to allow JavaScript so converted slices can coexist with untouched code. If a legacy slice needs intermediate checking, use a focused migration configuration or file-level `checkJs` rather than enabling noisy checking for the whole repository at once.

The final frontend compiler policy is:

- `strict: true` remains enabled.
- `allowJs: false` is enabled.
- `checkJs` is no longer needed for application source.
- `noUnusedLocals` and `noUnusedParameters` are enabled after cleanup.
- `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` are considered only after the main migration is green, as a separate tightening step.

The final ESLint configuration must parse TypeScript with the existing `typescript-eslint` stack, use type-aware linting where practical, and stop disabling unused-variable checks for migrated application code.

### 6. Error and behavior policy

TypeScript migration must not change observable behavior. Existing loading, empty, error, retry, validation, toast, keyboard, focus, mobile, and desktop states remain part of the contract.

The error path is:

```text
unknown client/API error
  -> normalizeApiError(error)
  -> ApiErrorResponse or safe fallback
  -> existing query, form, toast, or inline alert state
```

The migration must not hide errors through `any`, empty catches, or untyped fallback objects. Any unavoidable boundary assertion must be narrow, local, and justified by the contract being consumed.

## Verification strategy

For every migration wave, run from `src/frontend`:

```powershell
pnpm typecheck
pnpm lint
pnpm test:ci
pnpm build
```

After waves that change routes or authenticated behavior, also run the relevant existing Playwright journeys. Visual and accessibility behavior is checked through DOM assertions, keyboard behavior, responsive checks, and screenshots where already covered; a successful TypeScript compile alone is insufficient.

If Windows prevents Vite, Chromium, or a Playwright launcher from starting, report the environment failure separately and use a manually served production preview for the runtime checks that can still be performed. Do not report blocked browser execution as a passing E2E result.

The final verification includes:

- Frontend typecheck, lint, unit/component tests, production build, and relevant E2E journeys.
- Backend typecheck, tests, build, and Prisma validation to confirm the migration did not disturb the independent backend package.
- A repository search proving there are no `.js`/`.jsx` files in `src/frontend/app`, `src/frontend/features`, `src/frontend/shared`, or the frontend entrypoint, while documented E2E/tooling exceptions remain allowed.
- A search proving new application code does not introduce `any`, blanket `@ts-ignore`, or unreviewed suppression patterns.

## Acceptance criteria

1. All frontend application source in `app`, `features`, `shared`, and the entrypoint uses `.ts` or `.tsx`.
2. All frontend unit/component tests outside E2E use `.ts` or `.tsx` and compile under the same strict TypeScript project.
3. The documented JavaScript exceptions remain limited to E2E and tooling/support files that do not materially improve application type-safety.
4. `allowJs` is false, `jsconfig.json` is removed, and CI prevents new JavaScript in application source.
5. API contracts, query functions, mutation payloads, component props, form state, route parameters, and errors have explicit types at their boundaries.
6. Existing frontend behavior and backend contracts are unchanged, including loading/error/empty states, authentication flows, responsive behavior, accessibility behavior, and ownership-related UI states.
7. Frontend and backend verification commands complete successfully, or any environment-only blocker is reported with the exact command and stage that could not run.
8. Migration commits are small and scoped by wave or feature, and unrelated dirty worktree changes are not included.

## Rollback and recovery

Each wave is independently revertible because it changes a bounded set of source and test files. If a converted slice causes a runtime or test regression, revert that slice while leaving earlier verified waves intact. Do not restore files by resetting the entire worktree; preserve unrelated user changes and recover only the migration slice under review.
