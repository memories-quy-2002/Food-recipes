# Food Recipes Auth and Security Foundation Design

**Date:** 2026-08-25
**Status:** Approved for implementation
**Scope:** Authentication session migration, account recovery UI, authorization verification, and security-focused browser/API coverage

## Goal

Improve the core security boundary without breaking the existing recipe, wishlist, planning, pantry, and profile journeys. Access tokens must become memory-only in the browser, refresh sessions must remain server-owned through an HttpOnly cookie, and protected resource ownership must be proven by backend tests.

## Current evidence

- The backend already has refresh-session rotation, hashed session tokens, password reset tokens, email verification tokens, auth throttling, request validation, and a `RolesGuard`.
- The frontend still persists the access JWT as `jwt` in `localStorage` or `sessionStorage`, while its Axios client already attempts `/auth/refresh` after a `401`.
- The backend controller sets a `food_refresh` HttpOnly cookie and does not expose the refresh token in its public response.
- Existing account UI supports login and signup but does not expose forgot-password, reset-password, or email-verification screens.

## Product requirements

### 1. Memory-only access session

- Login and signup store the returned access JWT only in a module-scoped memory token store.
- Redux stores authenticated user metadata and status, never access or refresh tokens.
- `localStorage` and `sessionStorage` may retain only non-sensitive display preferences and existing return-intent data; they must not contain `jwt`, `refreshToken`, or equivalent session identifiers.
- `withCredentials: true` remains enabled so the browser sends the `food_refresh` cookie.
- On application boot, the frontend attempts one refresh session call and restores the current user when the cookie is valid.
- A `401` request retries once after a shared refresh promise resolves. Refresh requests themselves are never recursively retried.
- Logout revokes the current refresh session on the backend, clears the cookie, clears the in-memory token, and resets the Redux auth state.

### 2. Recovery and verification flows

- The account flow exposes forgot-password with a generic success message that does not reveal account existence.
- `/account/reset-password?token=<token>` validates a token before submitting a new password. The token is never rendered, logged, or stored in Redux, browser storage, or analytics.
- `/account/verify-email?token=<token>` consumes a single-use verification token and provides safe success/invalid/expired states.
- Authenticated unverified users see a dismissible reminder with a pending-safe resend action.
- Existing login, signup, protected-route, and return-intent behavior remains compatible.

### 3. Server authorization

- The server derives the actor from the JWT and never trusts a client-owned user ID for protected mutations.
- Recipe create/edit/publish/archive/delete, wishlist/collection, notes, planning, shopping-list, pantry, and report operations must enforce authenticated ownership where applicable.
- Admin moderation routes use both `JwtAuthGuard` and `RolesGuard`.
- A regular user receives a safe forbidden response for admin routes; a user cannot read or mutate another user’s private resource.

### 4. Security and error boundaries

- Authentication errors remain generic where account enumeration is possible.
- Error envelopes retain `statusCode`, stable `code`, safe `message`, and `requestId`.
- Authorization headers, cookies, passwords, reset tokens, verification tokens, and webhook secrets must never appear in logs or response bodies.
- Existing validation, CORS allowlisting, body limits, security headers, and auth throttling are preserved and covered by focused tests where they are part of the changed boundary.

## Architecture

### Frontend

Add a small `authTokenStore` with `get`, `set`, and `clear` operations backed only by module memory. Update the auth slice so its persisted shape contains user/status data but no token. `AuthProvider` owns boot hydration and publishes the current auth state to existing consumers. The Axios client reads the memory token for request headers, coordinates concurrent refreshes, and emits `auth:expired` only after refresh failure.

Keep recovery UI inside `src/frontend/features/auth`. Add typed API functions for the four existing recovery endpoints, route-level token screens, accessible form validation, pending states, generic status copy, and safe error handling. Use existing `Button`, `Input`, `PageHelmet`, toast, and account layout primitives.

### Backend

Retain `AuthService`, `AuthSessionRepository`, `AuthThrottleGuard`, and the HttpOnly refresh-cookie policy. Keep the refresh-token body DTO as a temporary compatibility bridge for existing API consumers, but the frontend must use the cookie path only. Add or extend focused tests for rotation, reuse detection, logout revocation, recovery token consumption, generic responses, and roles/ownership.

No new authentication provider or email provider is introduced. Existing recovery delivery remains the only delivery boundary, and its test transport must not send real email.

## Request flows

```text
Login or signup
  -> API validates credentials
  -> API returns access JWT and sets food_refresh HttpOnly cookie
  -> frontend stores access JWT in memory only
  -> protected requests use Authorization: Bearer <memory token>

Access JWT expires
  -> API returns 401
  -> Axios shares one /auth/refresh request using the cookie
  -> API rotates the hashed refresh session and sets a new cookie
  -> frontend replaces the memory token and retries once

Refresh fails
  -> frontend clears memory token and user state
  -> auth:expired drives the existing protected-route behavior
```

## Error and compatibility behavior

- Missing, invalid, expired, or consumed recovery tokens use one safe recovery error state.
- Forgot-password always returns the same success shape for validly formed known and unknown email addresses.
- A failed refresh never loops through the interceptor or redirects to an attacker-controlled URL.
- Existing legacy auth storage is read only during migration to allow a controlled logout/cleanup path; no new token is written there. The migration must remove legacy `jwt` values after the new in-memory session is established or the user logs out.
- Internal backend errors are normalized by the existing global filters and keep request IDs without exposing implementation details.

## Verification strategy

### Backend

- Jest unit tests for token rotation, reuse-family revocation, logout, reset/verification expiry and single-use behavior.
- Supertest/API tests for cookie flags, generic recovery responses, admin role enforcement, and cross-user ownership boundaries.
- Prisma validation and backend typecheck/build.

### Frontend

- Vitest tests for memory-only token storage, auth slice persistence, refresh coordination, logout, boot hydration, and recovery form states.
- Lint/typecheck/build with no new security-sensitive browser storage usage.
- Playwright journeys for login/protected access, expired access-token refresh, logout, forgot-password, invalid reset token, verification reminder/resend, mobile layout, keyboard labels, loading, and error states.
- Use a mocked delivery boundary for browser recovery journeys; use backend API tests for real token hashing, expiry, revocation, and cookie behavior.

## Scope boundaries

Included: access-token storage migration, refresh bootstrap/interceptor behavior, logout, password recovery UI, email verification UI, resend reminder, role/ownership test coverage, and security-focused verification.

Excluded: MFA, passwordless login, social login, account deletion, a production email provider, Redis/distributed throttling, a new upload architecture, and a new admin dashboard.

## Rollout

1. Add failing tests for the memory-only frontend contract and existing backend security boundaries.
2. Implement the frontend token/session migration while preserving the backend compatibility bridge.
3. Add recovery and verification screens using the existing backend APIs.
4. Add ownership and role API coverage for protected resource families.
5. Run package checks, builds, Playwright browser journeys, and a final security-focused diff review.
6. Remove legacy JWT storage writes and document the remaining compatibility bridge and its removal condition.
