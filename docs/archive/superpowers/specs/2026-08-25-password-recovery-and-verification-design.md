# Password Recovery and Email Verification Design

## Status

Approved direction for implementation planning.

## Goal

Expose the existing secure password recovery and email verification APIs through accessible frontend flows, using the configured email delivery webhook in production and test/dev delivery doubles without exposing account existence or recovery secrets in normal responses.

## Current context

- The backend already exposes `POST /api/v1/auth/forgot-password`, `reset-password`, `verify-email`, and authenticated `resend-verification`.
- Password reset and email verification tokens are stored as hashes and have expiry/consumed state.
- `RecoveryDeliveryService` sends `{ kind, email, token }` to `AUTH_MAIL_WEBHOOK_URL` and intentionally does not send in tests.
- The frontend currently provides login and signup only; it has no forgot-password, reset-password, or verification-token pages.

## Product behavior

1. Add `ForgotPasswordForm` to the account flow with email validation and a generic success message: “If an account matches that email, we sent recovery instructions.”
2. Add a public `/account/reset-password?token=<token>` route with new password and confirmation fields. Do not prefill or log the token.
3. On successful reset, invalidate the form, show confirmation, and link to login. On expired, consumed, or invalid tokens, show a safe recovery error and a link to request a new one.
4. After signup and on an authenticated account whose `email_verified_at` is absent, show a dismissible verification reminder with `Resend verification email`.
5. Add `/account/verify-email?token=<token>` that consumes the token once and links back to the account or login flow.
6. The production delivery URL is configured by `AUTH_MAIL_WEBHOOK_URL`; the frontend base URL used to build links is configured by `AUTH_PUBLIC_WEB_URL`. Local and automated tests inject a delivery fake and assert payloads without sending real email.
7. Existing login, signup, refresh, logout, and return-intent behavior remain unchanged.

## Architecture

Keep auth UI inside `src/frontend/features/auth`. Add small API functions for the four existing auth routes and presentational forms for each state. Extend `Account.jsx` only to switch between login, signup, and forgot-password views; keep reset and verify as route-level screens so a token cannot be lost when navigating within the account tab.

On the backend, keep token generation, hashing, expiry, generic response, and session revocation in `AuthService`. Extend `RecoveryDeliveryService` only to include an absolute link in the webhook payload when `AUTH_PUBLIC_WEB_URL` is configured:

```ts
type RecoveryDeliveryPayload = {
  kind: "password-reset" | "email-verification";
  email: string;
  token: string;
  link: string | null;
};
```

The token remains absent from HTTP responses and application logs. The webhook is the only delivery boundary.

## Security requirements

- Forgot-password always returns the same success response for known and unknown emails.
- Reset and verification tokens are single-use, hashed at rest, expiry-checked, and rejected after consumption.
- Successful password reset revokes the user's existing refresh sessions according to the current auth-session policy.
- Auth throttle guards remain active for recovery and verification token consumption.
- Do not place tokens in analytics events, error messages, logs, screenshots, or persisted Redux state.
- Do not commit webhook URLs, secrets, or production domains.

## Error and accessibility behavior

- Invalid email and password fields have labels, inline errors, and `aria-describedby` associations.
- Submit buttons show a pending label and prevent duplicate requests.
- Recovery success and failure use an `aria-live` status region.
- Token pages handle a missing token before making a request.
- The forms work with keyboard-only navigation, visible focus, mobile widths, and browser password managers.
- Network failures use actionable copy without exposing raw backend details.

## Testing and acceptance criteria

- Backend tests cover generic forgot responses, unknown emails, token expiry, token reuse, password reset session revocation, verification consumption, delivery link payloads, and throttling.
- Frontend tests cover form validation, API payloads, generic success copy, token extraction, reset success/failure, verification success/failure, resend pending state, and keyboard labels.
- Playwright covers forgot-password, invalid reset token, valid reset fixture, and verification reminder/resend with a mocked delivery boundary.
- An accessibility run reports no axe violations for account, reset, and verification screens.
- Existing auth and return-intent tests remain green.

## Out of scope

- Building an email provider, inbox UI, passwordless login, MFA, social login, or account deletion.
- Returning development tokens from production endpoints.
