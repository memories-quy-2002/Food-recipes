# Stack Alignment Task 4 Report

## Scope

Implemented the exact scope from `task-4-stack-brief.md`. Changes are limited to frontend scripts, frontend GitHub Actions gates, Playwright CI behavior, README documentation, Vercel configuration, and this report. Backend source, Prisma, Docker, API contracts, and product behavior were not changed by this task.

## Implementation

- Added deterministic scripts without removing the existing interactive commands:
  - `test:ci`: `vitest run`
  - `test:e2e:ci`: `playwright test`
- Extended the existing `frontend` workflow job to run locked install, `pnpm typecheck`, `pnpm test:ci`, and `pnpm build`.
- Added a dependent `frontend-e2e` workflow job using Node 24, pnpm 11.18.0, frozen install, explicit Chromium installation, and `pnpm test:e2e:ci`.
- Made the downstream Docker runtime gate wait for the frontend E2E gate.
- Kept Playwright on the existing Vite preview server and base URL. CI now uses one worker with two retries for deterministic execution; local runs retain the existing default parallelism and no retries.
- Added the current Vercel schema, `buildCommand: "pnpm build"`, `outputDirectory: "dist"`, and preserved the existing asset-safe SPA rewrite.
- Updated README stack, architecture ownership, verification commands, public `VITE_*` configuration, and Vercel deployment notes.

## Verification

| Command | Result |
| --- | --- |
| `corepack pnpm typecheck` | PASS |
| `corepack pnpm test:ci` | FAIL: default Vitest discovery loads pre-existing backend Jest-style specs and `e2e/current-user-journeys.spec.js`; `src/App.test.js` also has the existing JSX parse failure. |
| `corepack pnpm build` | PASS |
| `corepack pnpm test:e2e:ci` | FAIL: 15 passed, 2 failed. Chromium was available locally. |
| `corepack pnpm vitest run src/client` | PASS: 36 files, 127 tests |
| `git diff --check` | PASS |

## Playwright failures

The two failures are existing contract/product alignment issues outside this task's allowed scope:

1. `guest filters and sorts Recipes before opening a result` expects `/food?categories=1`, while the current application navigates to `/food?categoryId=1`.
2. `food listing recipe card exposes the correct href and navigates on Enter` cannot find the expected `Open Chocolate Banana Bread` link on the current `/food` page.

The E2E spec and product implementation were intentionally left unchanged.

## Worktree preservation

Unrelated dirty reports, backend/frontend implementation changes, plans, generated build/test artifacts, and other untracked files were preserved and excluded from the task commit.

## Task 4 review-fix evidence

Applied the review findings without changing product behavior:

- `package.json` now runs `test:ci` as `vitest run src/client`, so backend Jest specs, Playwright specs, and the stale root `src/App.test.js` are not discovered by the frontend CI gate.
- Updated the existing Playwright fixtures to use the current recipe contract: `recipe_description`, nullable `date_added`, and nullable `image_url` on both recipes. The existing list fixture now matches query-bearing `/recipes` requests, and the existing Food URL assertion expects `categoryId=1`.
- README deployment notes now document the legacy default pairing (`VITE_API_TARGET=legacy` or omitted plus `VITE_API_BASE_URL`) and the public Nest/Kong opt-in pair (`VITE_API_TARGET=nest` plus `VITE_KONG_BASE_URL`).

### Final verification

| Command | Result |
| --- | --- |
| `corepack pnpm typecheck` | PASS |
| `corepack pnpm test:ci` | PASS: 36 files, 127 tests |
| `corepack pnpm build` | PASS: Vite 8.1.3 build completed |
| `corepack pnpm test:e2e:ci` | PASS: 17 Playwright tests passed in 5.4s |
| `git diff --check` | PASS; Git emitted existing CRLF normalization warnings only |

The Vite build still reports its existing chunk-size warning for bundles over 500 kB; this is non-blocking and outside Task 4 scope.
