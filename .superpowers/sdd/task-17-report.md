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
- Kept `src/client` and `src/server`; the target-layout rename is a separate
  frontend follow-up.
- Added the frontend cutover matrix at
  `docs/frontend/api-cutover-matrix.md`.

## Verification

- Focused API client and recipe-query tests: passed (`11 tests`)
- Frontend production build: passed (`vite build`)
- Frontend typecheck: no root typecheck script/config is present; the build is
  the available frontend verification
- `git diff --check`: passed for the scoped diff
- Live Kong/Nest/PostgreSQL E2E: not run; this task does not require live services

## Limitations

Nest mode is a switchable compatibility path, not a production cutover claim.
Payload parity and browser behavior still require the live E2E gate documented
in the matrix. Categories and meals are not exposed by the checked-in Nest
controllers, so journeys depending on those endpoints remain on Express.

Commit: recorded in the final Task 17 handoff.
