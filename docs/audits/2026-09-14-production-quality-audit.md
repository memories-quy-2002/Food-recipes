# Production-quality audit

Date: 2026-09-14
Branch: `feat/recipe-platform-production-quality`
Scope: every tracked file returned by `git ls-files`; ignored files and generated
directories were excluded from the audit.

## Repository inventory

| Area | Tracked files | Current boundary |
| --- | ---: | --- |
| Repository | 828 | No root package; frontend and backend are independent packages |
| Frontend | 407 | React 19, TypeScript, Vite, React Router, TanStack Query, Tailwind v4 |
| Backend | 334 | NestJS, Prisma 7, PostgreSQL, REST/OpenAPI |
| `docs/` | 53 | Current contracts/runbooks plus historical material moved to archive |
| Markdown/MDX | 67 | Current developer docs, repository policies, and archived history |

The tracked-file inventory includes source, tests, migrations, CI, scripts,
configuration, assets, and Markdown. The audit did not treat an unreferenced
filename as proof of dead code: entrypoints, package scripts, generated-client
roles, test fixtures, and build-time integrations were checked separately.

## Baseline evidence

Passed:

- Frontend Vitest: 132 test files and 420 tests.
- Frontend TypeScript and ESLint checks.
- Frontend production build. Vite reports a main JavaScript chunk above 500 kB;
  this remains a P0 A performance follow-up.
- Backend check: 63 Jest suites and 309 tests, including migration validation.
- Backend production build and Prisma schema validation.
- All tracked backend static validators, including CI, security, migration,
  Docker, and production-reset safety validators.
- Frontend and backend `pnpm audit --audit-level high`: no known high-severity
  vulnerabilities in the installed lockfiles.

Environment boundary:

- The local runner uses Node 26.5.0. Prisma 7 declares support through the
  Node 24 line, so CI and production-like verification use Node 24. The local
  warning is recorded rather than hidden by changing package engines.
- The 62-test mocked Playwright suite could not launch because the configured
  Chromium headless shell is not installed locally. CI installs Chromium; a
  local browser installation is required before claiming browser results.
- No production database migration, reset, seed, or external deployment was run.

## Findings by priority

### P0 A: discovery and SEO

Implemented in the current wave:

- Recipe detail pages emit public-field-only Recipe JSON-LD with validated
  durations, ingredients, instructions, nutrition, dates, and rating aggregates.
- Page metadata keeps one authoritative robots value, deterministic canonical
  URLs, and absolute social/structured-data image URLs.
- Home and related-recipe surfaces consume the bounded Home feed instead of
  fetching the complete public catalog; the feed mapper deduplicates and caps
  discovery recipes at 24.

Already present:

- `/recipes` accepts bounded query, category, meal, filter, sort, page, and limit parameters.
- PostgreSQL search indexes exist in `20260826100000_add_recipe_search_indexes`:
  `pg_trgm` indexes for name/description and a simple-language full-text index.
- Public recipe reads filter to published records; owner reads are separate.
- Home suggestions use a debounced, bounded server request.

Remaining improvements:

- The production build still reports a main JavaScript chunk above 500 kB;
  route-level code splitting and browser verification remain open.
- The current public URL is query-based (`/recipe?id=...`). It is retained for
  compatibility, while canonical structured-data work must be deterministic and
  safely encoded.

### P0 B: authentication and security

Already present:

- Short-lived access JWTs, HttpOnly refresh cookies, hashed refresh sessions,
  rotation, reuse-family revocation, logout, auth throttling, ownership checks,
  body limits, security headers, and generic recovery responses.
- Password reset and email verification tokens are single-use and hashed at rest.

Required improvements:

Implemented in the current wave:

- The account flow now exposes accessible forgot-password UI with generic
  account-safe responses.
- /account/reset-password validates both new-password fields, handles missing
  or expired links safely, clears the form after success, and never renders the
  recovery token.
- /account/verify-email consumes the single-use token with loading, success,
  failure, and missing-token states; authenticated users receive updated
  verification state without a full reload.
- Authenticated users with email_verified: false receive a dismissible
  verification reminder with a keyboard-accessible resend action.
- Production environment validation and the delivery adapter fail explicitly
  when the mail webhook or public web URL is missing; development and test
  delivery behavior remains configurable.
- Recovery API, AuthService, component, accessibility, and mocked browser
  journeys are covered by focused tests.

Remaining operational work:

- Rehearse the configured delivery provider, CORS, cookies, and recovery links
  against a disposable or staging database before production rollout.
- The compatibility body-token route remains documented and must not be used by
  new frontend code.

### P0 E: planning, shopping, and pantry

Implemented in the current wave:

- Personal and household planning, recurring rules, templates, shopping imports,
  pantry quantities/expiry, leftovers, cooking sessions, history, and journal
  flows are wired through the Nest API and frontend.
- Household role checks and read-only UI behavior are represented in the current
  controllers and queries.
- `20260914100000_harden_kitchen_loop_indexes` adds personal/household plan
  indexes, household pantry and shopping-list indexes, removes the redundant
  non-unique plan-item index, keeps the existing unique plan/date/slot index as
  the item-read path, and guards the unchecked shopping-item uniqueness
  invariant with a preflight duplicate check.
- Shopping imports are idempotent under concurrent requests. Updating an item
  into an existing unchecked duplicate returns the stable
  `SHOPPING_ITEM_DUPLICATE` conflict instead of an unhandled database error.
- The shopping editor now stays open after a failed save, and the deterministic
  Playwright kitchen-loop journey covers recipe -> plan -> shopping list ->
  pantry -> cooking -> history/journal, including a failed checkbox retry,
  duplicate import, checked-item pantry import, and shortage continuation.

Remaining operational verification:

- Apply and rehearse the migration on a disposable or staging database only
  after reviewing any duplicate preflight failure; run the real-stack API and
  browser flow with household viewer/member cases and inspect representative
  query plans before production rollout.

## Cleanup decisions

- Keep all direct dependencies that have an import, script, compiler, test,
  runtime adapter, or generated-client role. The three active feature SCSS
  files are now plain CSS, so the direct `sass` dependency has been removed.
- Remove only verified dead assets: the Vite starter `src/logo.svg` and the
  unreferenced `toggle-column-svgrepo-com.svg` icon.
- Move old implementation plans, design specs, and task reports to
  `docs/archive/`; retain them as historical evidence rather than presenting
  stale paths as current instructions.
- No current source module or dependency is deleted solely because a textual
  search returned few references.

## Audit conclusion

The system has a strong modular foundation and broad user journeys, but it is
not production-complete until the P0 A/B/E gaps, bounded Home reads, browser
verification, the documented Node 24 runtime boundary, and staging evidence
for database changes are handled. This document is updated as each delivery
wave lands.
