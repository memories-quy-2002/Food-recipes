# Task 3 Report: Refresh bootstrap, logout, and protected-route UX

## Status

Implementation complete on `codex/auth-security-foundation`.

## Implementation

- Added `authSessionApi.refresh()` and `.logout()` around the refresh-cookie API boundary; refresh validates `{ user, token }` and writes only the access token to the module memory store.
- Added `authLogout` to the frontend route contract.
- Added `hydrated`, `setHydrated`, and `restoreSession` to the auth slice while preserving the existing local/session user metadata shape.
- Updated `AuthProvider` to bootstrap once per mounted provider, restore the returned user, handle failures, and expose hydration state through the auth context.
- Updated `ProtectedRoute` to render an accessible session-check status before redirecting unauthenticated users.
- Kept Axios refresh single-flight behavior and added a concurrent-401 test.
- Routed desktop header, mobile navigation, and profile logout through the server endpoint, clearing local auth in `finally` even when the server is unavailable.
- Removed the header's duplicate token validation/refresh path; it now renders the restored user metadata from auth state.

## TDD evidence

Focused tests were written first and failed for the expected missing `authSessionApi`/hydration behavior. After implementation:

```text
corepack pnpm@11.18.0 exec node_modules/.bin/vitest run features/auth/api/authSessionApi.test.js features/auth/components/ProtectedRoute.test.jsx app/AuthProvider.test.jsx shared/layout/HeaderAuthButton.test.jsx shared/api/apiClient.test.js shared/layout/Header.navigation.test.jsx
```

Passed: 6 files, 27 tests.

```text
corepack pnpm@11.18.0 exec node_modules/.bin/eslint app/AuthProvider.jsx app/AuthProvider.test.jsx features/auth/api/authSessionApi.js features/auth/api/authSessionApi.test.js features/auth/components/ProtectedRoute.jsx features/auth/components/ProtectedRoute.test.jsx features/auth/state/authSlice.jsx shared/api/apiClient.test.js shared/api/routes.js shared/layout/HeaderAuthButton.jsx shared/layout/HeaderAuthButton.test.jsx shared/layout/HeaderToggle.jsx features/profile/Profile.jsx
```

Passed. Frontend `typecheck` and `git diff --check` passed. The static scan found no `localStorage`/`sessionStorage` JWT writes, old token adapter names, or Redux token-field consumers in `src/frontend`.

The first full Vitest pass exposed an existing route test fixture that did not include the new `hydrated` auth field. Updating that mock to the new auth-state contract fixed the regression. Final full Vitest verification passed:

```text
Test Files  89 passed (89)
Tests       286 passed (286)
```

Frontend production build, full ESLint, and typecheck also passed. Full Playwright and real-browser smoke remain deferred to Task 6.

A targeted Playwright guest journey was attempted after the preview build started, but it could not complete because the journey does not mock the new refresh bootstrap and no backend was running at `http://localhost:3000`. The refresh bootstrap now has a five-second timeout so an unavailable auth API cannot leave protected UI in an indefinite loading state. No browser pass is claimed; Task 6 must add the shared unauthenticated bootstrap fixture and rerun the journeys with the required API/runtime setup.
