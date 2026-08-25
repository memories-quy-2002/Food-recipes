# Task 2 Report

## Status

Complete.

## Commit

- Branch: `codex/auth-security-foundation`
- Commit: `021b0e3`
- Message: `fix(auth): keep access tokens in memory`

## Files changed

- `src/frontend/features/auth/state/authTokenStore.js`
- `src/frontend/features/auth/state/authTokenStore.test.js`
- `src/frontend/features/auth/state/authSlice.jsx`
- `src/frontend/features/auth/hooks/useLoginForm.js`
- `src/frontend/features/auth/hooks/useSignupForm.js`
- `src/frontend/shared/api/config.js`
- `src/frontend/shared/api/apiClient.test.js`

Unrelated existing dirty files were not staged or modified.

## Implementation summary

- Added a module-only access-token store with `getAccessToken`, `setAccessToken`, and `clearAccessToken`.
- Kept user metadata and remember-session flags in the existing local/session storage shape.
- Removed JWT reads and writes from the auth slice; login reducers now receive `{ user }` only.
- Login now sends the selected `remember` value and stores the returned access token in memory before dispatching the user-only action.
- Signup stores its returned access token in memory before dispatching the user-only action.
- Logout clears the memory token.
- Preserved the existing Axios module by changing its config adapters to use the memory store, including refresh-token replacement.

## TDD evidence

### RED

Added the token-store tests and changed the API client assertions before creating the production token store. The focused suite then failed for the intended missing-feature reason:

```text
FAIL shared/api/apiClient.test.js
Error: Cannot find package '@/features/auth/state/authTokenStore'

FAIL features/auth/state/authTokenStore.test.js
Error: Cannot find module './authTokenStore'
```

### GREEN

After the minimal implementation, the focused suite passed:

```text
Test Files  2 passed (2)
Tests       10 passed (10)
```

The tests cover module-memory storage/clearing, no browser-storage access, Axios use of the memory token, ignoring stored JWT values, and refresh-token replacement without a storage write.

## Exact commands and results

The brief’s exact focused command was run from `src/frontend`:

```text
corepack pnpm@11.18.0 exec vitest run features/auth/state/authTokenStore.test.js shared/api/apiClient.test.js
```

On this Windows checkout it failed before loading the suites because `pnpm exec` could not resolve the `vitest` command (`'vitest' is not recognized as an internal or external command`). The equivalent pinned command using the checked-in executable was used for valid RED/GREEN verification:

```text
corepack pnpm@11.18.0 exec node_modules/.bin/vitest run features/auth/state/authTokenStore.test.js shared/api/apiClient.test.js
```

This command produced the RED failure above, then passed in the final verification with 2 files and 10 tests passing.

The brief’s scan was run:

```text
rg -n 'setItem\(["'']jwt|setItem\(["'']refresh|token.*localStorage|token.*sessionStorage' src/frontend
```

It found six pre-existing JWT writes in `src/frontend/e2e/` test fixtures only. No new production JWT persistence write was found in the changed frontend files.

Additional scoped verification:

```text
corepack pnpm@11.18.0 exec node_modules/.bin/eslint features/auth/state/authTokenStore.js features/auth/state/authTokenStore.test.js features/auth/state/authSlice.jsx features/auth/hooks/useLoginForm.js features/auth/hooks/useSignupForm.js shared/api/config.js shared/api/apiClient.test.js
```

Passed with no lint output.

```text
git diff --check
```

Passed. The commit hook also ran `tsc -p tsconfig.json --noEmit` and passed.

## Self-review

- Confirmed the branch is `codex/auth-security-foundation`.
- Confirmed only the seven listed frontend files were staged.
- Confirmed unrelated backend, CI, documentation, and existing SDD dirty files remained unstaged.
- Confirmed login, signup, remember payload, user metadata persistence, and logout paths retain their intended behavior.
- Confirmed Axios request authorization and refresh retry now use memory state.
- Confirmed no access token is placed in Redux auth state by the changed reducers.
- Confirmed whitespace validation and scoped lint passed.

## Concerns

- The repository’s current Windows `pnpm exec vitest` resolution requires the explicit `node_modules/.bin/vitest` path for execution; the literal brief command remains documented as attempted and failed for that tooling reason.
- The required repository-wide scan still reports six pre-existing JWT writes in e2e fixtures. They were outside the allowed edit list and were not changed; they are test-scoped fixtures rather than application persistence code.
- Vitest prints an existing Vite warning about `configLoader: 'native'` and CommonJS/ESM configuration. It does not affect the passing focused tests.

## Reviewer fix

### Modifications

- Updated `AuthProvider` to expose `getAccessToken()` from the memory-only token store instead of removed Redux token fields.
- Updated `HeaderAuthButton` to use the memory token, refresh the access token through the HttpOnly refresh-cookie boundary when a remembered local user is restored, validate the resulting token through `/auth/token`, fall back to persisted user metadata only when no token is available, and preserve 401 logout/navigation behavior.
- Renamed the API config adapters to `getAuthToken` and `setAuthToken`; updated Axios and API client tests so storage semantics are not implied by the names.
- Added focused `HeaderAuthButton` and `AuthProvider` tests covering refresh bootstrap, memory-token validation, and context exposure.
- Added `e2e/auth-fixtures.js` and migrated all six JWT-writing fixtures to store only `isAuthenticated` and user metadata, while mocking `/auth/refresh` and `/auth/token` with a test-only in-memory token flow. No E2E fixture writes `localStorage.jwt` now.

### Scoped verification

- Focused Vitest: `4 passed (4)` files and `14 passed (14)` tests.
- Affected ESLint: passed with no output.
- Frontend TypeScript: passed with no output.
- `git diff --check`: passed.
- Static scan for `getStoredAuthToken`, `storeAuthToken`, Redux token fields, and `localStorage.setItem("jwt", ...)`: no matches in the changed application paths.
- Full E2E was not run, per the explicit instruction to stop browser/test processes and not wait on a full browser run. The E2E changes were verified by scoped ESLint and static inspection only.
