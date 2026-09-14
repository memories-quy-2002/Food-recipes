# Food Recipes Security Hardening Design

**Date:** 2026-08-23
**Status:** Draft for implementation planning
**Scope:** Session security, authorization, API hardening, uploads, and abuse controls

**Current implementation slice:** Backend API, database, and infrastructure
controls only. Frontend token-storage migration is intentionally deferred to a
later slice.

## Goal

Reduce the blast radius of browser XSS and stolen credentials, establish
server-owned authorization, and make public recipe/review/upload endpoints
resistant to common abuse without weakening the current Nest/Kong contract.

## Existing risks

- The frontend stores the bearer JWT in local or session storage.
- The access JWT is configured with a default one-day lifetime and there is no
  refresh-token rotation endpoint.
- Kong applies a single local IP rate limit, but login-specific brute-force
  controls are not visible.
- Helmet/security headers and explicit request body limits are not visible in
  the Nest bootstrap.
- Recipe images are uploaded directly from the browser to Supabase, while the
  API accepts a client-provided image URL string.
- The API has no role-backed moderation boundary.

## Security principles

1. Passwords, access tokens, refresh tokens, and service-role keys never enter
   frontend persistent storage or logs.
2. The server derives actor identity from the authenticated session, not from a
   request-owned user ID.
3. Authorization is enforced in the API; frontend guards are UX only.
4. Security controls fail closed in production and are explicit in tests.
5. Compatibility routes are temporary and have a removal criterion.

## Session architecture

Use a short-lived access JWT in memory and a rotated refresh token in an
HttpOnly cookie.

- Access JWT lifetime: 15 minutes in production; configurable for tests.
- Refresh token: opaque random value, stored only as a SHA-256 hash in
  `auth_sessions`, with user ID, expiry, created time, revoked time, and a
  session family identifier.
- Cookie: `HttpOnly`, `Secure` in production, `SameSite=Lax`, explicit path
  `/api/v1/auth`.
- `POST /auth/refresh` rotates the refresh token and invalidates the previous
  token. Reuse of a revoked token revokes the entire session family.
- `POST /auth/logout` revokes the current refresh session and clears the cookie.
- Login and signup may return the existing `{ user, token, message }` response
  during migration, but frontend code stores `token` only in memory and calls
  refresh on application boot.
- The legacy `POST /auth/token` compatibility bridge is marked deprecated and
  is removed after all frontend consumers use `/auth/refresh`.

## Account recovery and authorization

Add:

- `role` on accounts with values `user` and `admin`, defaulting to `user`;
- `password_reset_tokens` with hashed single-use tokens and a 30-minute expiry;
- `email_verification_tokens` with hashed single-use tokens and a 24-hour expiry;
- `POST /auth/forgot-password`, `POST /auth/reset-password`,
  `POST /auth/verify-email`, and `POST /auth/resend-verification`;
- `RolesGuard` and an `@Roles('admin')` decorator for moderation endpoints.

Forgot-password responses are deliberately identical for known and unknown
emails. Tokens are never returned in API responses or logs. Email delivery is
abstracted behind a port; development uses a captured test transport and
production configuration supplies the actual provider outside this repository.

## API hardening

- Add Helmet-equivalent security headers early in bootstrap, including
  `nosniff`, frame protection, referrer policy, and a CSP compatible with the
  Vite frontend.
- Disable Express fingerprinting.
- Set explicit JSON and URL-encoded body limits appropriate for recipe payloads.
- Keep CORS origins allowlisted from `CORS_ORIGINS`; reject wildcard origins when
  credentials are enabled.
- Keep the global validation pipe with transform, whitelist, and forbidden
  non-whitelisted properties.
- Add auth-specific throttling for login, signup, forgot-password, and refresh:
  per-IP and per-normalized-email failure windows. Kong's general 60/minute
  limit remains a second layer, not the only control.
- Keep request IDs in error responses and structured logs, but never log
  Authorization headers, cookies, passwords, or reset tokens.
- Add dependency audit to CI with a documented failure policy for high/critical
  advisories.

## Upload architecture

Replace anonymous browser upload credentials with a server-issued short-lived
upload grant:

```text
POST /api/v1/media/recipe-image/upload-url
Authorization: Bearer <access-token>
{ filename, contentType, size }

200 { uploadUrl, objectPath, expiresAt }
```

The API allows only a small image MIME allowlist, a maximum size of 5 MB, and a
safe generated object path. The backend never returns or exposes a service-role
key. The frontend uploads to the returned URL and sends the resulting object
path to recipe create/update. A scheduled cleanup or explicit replacement flow
removes abandoned objects after failed publishes.

## Verification requirements

- Unit/API tests cover refresh rotation, reuse detection, logout revocation,
  role enforcement, reset-token expiry/reuse, email-enumeration resistance,
  request-size rejection, auth throttling, and upload validation.
- Browser tests prove login, reload, refresh, logout, protected route access,
  and an expired access-token recovery without local/session storage JWTs.
- Security tests assert sensitive values do not appear in logs and error bodies.
- CI runs lint, typecheck, unit/API tests, dependency audit, static validators,
  and the browser suite.
- Runtime deployment verification checks response headers, cookie flags, CORS,
  Kong forwarding, and the health endpoints.

## Rollout

Ship additive database tables first. Add refresh endpoints and support both
legacy bearer and new refresh flow behind a short migration window. Migrate the
frontend to memory-only access tokens, then remove the `auth/token` bridge.
Enable admin moderation only after role tests and seed/admin provisioning are
verified. Upload URL issuance stays authenticated from the first release.
