# Task 17 report: Frontend API cutover support

## Scope completed

- Preserved the legacy Express API as the default and fallback.
- Added `VITE_API_TARGET=nest`/`kong` selection with a configurable
  `VITE_KONG_BASE_URL` and `/api/v1` base prefix.
- Added Nest-only JWT forwarding from the existing authenticated `jwt` values
  in local/session storage as `Authorization: Bearer <token>`.
- Preserved the existing `auth:expired` event on HTTP 401 responses.
- Added explicit legacy/Nest route mappings. Categories and meals remain
  legacy-only and throw a compatibility error in Nest mode rather than calling
  a missing route.
- Fixed concrete Nest consumer contracts without changing the legacy payloads:
  wishlist mutations use `recipeId` and accept `201`; create-recipe payloads
  map to `CreateRecipeDto` IDs/minutes and accept `201`; profile updates send
  direct DTO fields and consume the direct user response; recipe deletion
  accepts `204`; nested Nest wishlist entries are recognized by recipe detail.
- Kept `src/client` and `src/server`; the target-layout rename is a separate
  frontend follow-up.
- Added the frontend cutover matrix at
  `docs/frontend/api-cutover-matrix.md`.

## Verification

- Focused API client, mutation serializer, route, and affected consumer tests:
  passed (`11 test files`, `45 tests`)
- Frontend production build: passed (`vite build`)
- Frontend typecheck: no root typecheck script/config is present; the build is
  the available frontend verification
- `git diff --check`: passed for the scoped diff
- Live Kong/Nest/PostgreSQL E2E: not run; this task does not require live services

## Limitations

Nest mode is a switchable compatibility path, not a production cutover claim.
The checked-in consumer payloads/statuses now match the documented Nest DTOs,
but browser behavior still requires the live E2E gate documented in the matrix.
Categories and meals are not exposed by the checked-in Nest controllers, so
the create-recipe browser journey and all taxonomy-dependent journeys remain
legacy-only. Kong routing, PostgreSQL data, JWT issuer/signature, CORS, and
full authenticated browser parity remain unverified.

Commit: recorded in the final Task 17 handoff after scoped verification.
