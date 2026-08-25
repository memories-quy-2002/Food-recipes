# Password Recovery and Email Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose secure forgot-password, reset-password, email verification, and resend-verification flows through the existing NestJS auth API and React account UI.

**Architecture:** Keep token generation, hashing, expiry, throttling, generic responses, and session revocation in `AuthService`. Add small frontend API functions and route-level token screens. Extend the existing recovery webhook payload with absolute links from `AUTH_PUBLIC_WEB_URL`; local/tests use a delivery fake and never return real tokens over HTTP.

**Tech Stack:** NestJS, class-validator, existing auth throttling/session services, React/JSX, React Router, Axios, Vitest/Testing Library, Jest/Supertest, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-25-password-recovery-and-verification-design.md`

## Global Constraints

- Work only on `feature/recipe-workflows`; do not commit to `master`.
- Preserve the existing login, signup, refresh, logout, and return-intent behavior.
- Never reveal account existence, raw tokens, webhook secrets, or raw delivery errors.
- Keep `AuthThrottleGuard` on recovery/token-consuming routes and use the existing HttpOnly refresh-session policy.
- Do not add an email provider, authentication dependency, or token storage in frontend state.
- Test keyboard, mobile, loading, error, success, and screen-reader status behavior.

---

### Task 1: Lock down the recovery delivery contract

**Files:**
- Modify: `src/backend/src/modules/auth/recovery-delivery.service.ts`
- Create: `src/backend/src/modules/auth/recovery-delivery.service.spec.ts`
- Modify: `src/backend/.env.example`
- Modify: `src/backend/src/config/env.validation.ts`

**Interfaces:**
- Consumes: `AUTH_MAIL_WEBHOOK_URL`, `AUTH_PUBLIC_WEB_URL`, token kind, email, token.
- Produces: webhook payload `{ kind, email, token, link }`.

- [ ] **Step 1: Write failing delivery tests**

```ts
it('adds a password reset link without logging or returning the token', async () => {
  await service.sendPasswordReset('cook@example.test', 'secret-token');
  expect(fetchMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
    body: expect.stringContaining('reset-password?token=secret-token'),
  }));
});

it('does not call the webhook in test mode', async () => {
  process.env.NODE_ENV = 'test';
  await service.sendEmailVerification('cook@example.test', 'token');
  expect(fetchMock).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the tests to verify failure**

```powershell
corepack pnpm@11.18.0 exec jest src/modules/auth/recovery-delivery.service.spec.ts --runInBand
```

Expected: FAIL because link construction and the test boundary are not covered/implemented.

- [ ] **Step 3: Implement link construction and safe configuration**

Use `new URL` with the configured public origin and encode the token as a query parameter. Use `/account/reset-password` for password reset and `/account/verify-email` for verification. When the public URL is absent, send `link: null`; never put the token in a response or log message.

- [ ] **Step 4: Run backend focused tests and validation**

```powershell
corepack pnpm@11.18.0 exec jest src/modules/auth/recovery-delivery.service.spec.ts src/modules/auth/auth.service.spec.ts --runInBand
corepack pnpm@11.18.0 prisma:validate
```

Expected: PASS.

- [ ] **Step 5: Commit the delivery boundary**

```powershell
git add src/backend/src/modules/auth/recovery-delivery.service.ts src/backend/src/modules/auth/recovery-delivery.service.spec.ts src/backend/.env.example src/backend/src/config/env.validation.ts
git commit -m "feat(auth): add recovery delivery links"
```

### Task 2: Add typed frontend recovery API functions

**Files:**
- Create: `src/frontend/features/auth/api/passwordRecoveryApi.ts`
- Create: `src/frontend/features/auth/api/passwordRecoveryApi.test.ts`
- Modify: `src/frontend/shared/api/routes.js`
- Modify: `src/frontend/shared/api/contracts.ts`

**Interfaces:**
- Produces:

```ts
requestPasswordReset(email: string): Promise<MessageResponse>;
resetPassword(token: string, newPassword: string): Promise<MessageResponse>;
verifyEmail(token: string): Promise<MessageResponse>;
resendVerification(): Promise<MessageResponse>;
```

- [ ] **Step 1: Write failing API contract tests**

Assert exact paths, methods, and body names: `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-email`, `/auth/resend-verification`.

- [ ] **Step 2: Run focused tests and verify failure**

```powershell
cd src/frontend
pnpm exec vitest run features/auth/api/passwordRecoveryApi.test.ts
```

Expected: FAIL because the module and route helpers do not exist.

- [ ] **Step 3: Implement the four functions**

```ts
export const requestPasswordReset = async (email: string) => {
  const response = await axios.post(apiRoutes.forgotPassword, { email });
  return response.data;
};
```

Follow the existing Axios/error normalization pattern and keep tokens out of query caches, Redux, and telemetry.

- [ ] **Step 4: Run focused tests and lint**

```powershell
pnpm exec vitest run features/auth/api/passwordRecoveryApi.test.ts
pnpm exec eslint features/auth/api/passwordRecoveryApi.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the frontend API contract**

```powershell
git add src/frontend/features/auth/api/passwordRecoveryApi.ts src/frontend/features/auth/api/passwordRecoveryApi.test.ts src/frontend/shared/api/routes.js src/frontend/shared/api/contracts.ts
git commit -m "feat(auth): add recovery client contracts"
```

### Task 3: Build forgot-password and token screens

**Files:**
- Create: `src/frontend/features/auth/components/ForgotPasswordForm.jsx`
- Create: `src/frontend/features/auth/components/ForgotPasswordForm.test.jsx`
- Create: `src/frontend/features/auth/ResetPassword.jsx`
- Create: `src/frontend/features/auth/ResetPassword.test.jsx`
- Create: `src/frontend/features/auth/VerifyEmail.jsx`
- Create: `src/frontend/features/auth/VerifyEmail.test.jsx`
- Modify: `src/frontend/features/auth/Account.jsx`
- Modify: `src/frontend/app/AppRoutes.jsx`

**Interfaces:**
- Consumes: typed API functions, existing `AccountForm` styles, `PageHelmet`, `Button`, `Input`, toast/status patterns.
- Produces: `/account/reset-password?token=...` and `/account/verify-email?token=...`.

- [ ] **Step 1: Write failing component tests**

```jsx
it('shows generic recovery success copy for any email', async () => {
  render(<ForgotPasswordForm />);
  await userEvent.type(screen.getByLabelText(/email/i), 'cook@example.test');
  await userEvent.click(screen.getByRole('button', { name: /send recovery/i }));
  expect(await screen.findByRole('status')).toHaveTextContent(/if an account matches/i);
});

it('does not submit reset without a token', () => {
  renderAt('/account/reset-password');
  expect(screen.getByRole('alert')).toHaveTextContent(/invalid recovery link/i);
});
```

- [ ] **Step 2: Run focused tests to verify failure**

```powershell
pnpm exec vitest run features/auth/components/ForgotPasswordForm.test.jsx features/auth/ResetPassword.test.jsx features/auth/VerifyEmail.test.jsx
```

Expected: FAIL because the components/routes do not exist.

- [ ] **Step 3: Implement accessible form states**

Use controlled local state, client validation, pending submit labels, `aria-describedby` field errors, and `aria-live="polite"` result messages. Extract the token with `useSearchParams`, never render it back into the page, and navigate to login only after a successful reset.

- [ ] **Step 4: Add account reminder and resend action**

Render the verification reminder only when the authenticated user is unverified. Disable resend while pending, show a non-sensitive success status, and retain the current page after success.

- [ ] **Step 5: Run focused tests and accessibility lint**

```powershell
pnpm exec vitest run features/auth/components/ForgotPasswordForm.test.jsx features/auth/ResetPassword.test.jsx features/auth/VerifyEmail.test.jsx features/auth/AccountForm.return-intent.test.jsx
pnpm exec eslint features/auth/Account.jsx features/auth/ResetPassword.jsx features/auth/VerifyEmail.jsx features/auth/components/ForgotPasswordForm.jsx app/AppRoutes.jsx
```

Expected: PASS.

- [ ] **Step 6: Commit the account recovery UI**

```powershell
git add src/frontend/features/auth src/frontend/app/AppRoutes.jsx
git commit -m "feat(auth): add password recovery screens"
```

### Task 4: Verify end-to-end security behavior

**Files:**
- Modify: `src/backend/test/auth.e2e-spec.ts` or the existing auth API test file
- Create: `src/frontend/e2e/password-recovery-journey.spec.js`
- Create: `src/frontend/e2e/email-verification-journey.spec.js`

- [ ] **Step 1: Add backend contract tests** for generic forgot responses, invalid/expired/consumed tokens, session revocation, verification consumption, and throttle behavior.
- [ ] **Step 2: Add mocked browser journeys** for forgot-password, invalid reset token, valid reset fixture, verification success, and resend pending/success.
- [ ] **Step 3: Run verification**

```powershell
cd src/backend
corepack pnpm@11.18.0 check
corepack pnpm@11.18.0 build
cd ../frontend
pnpm check
pnpm test:e2e:ci -- e2e/password-recovery-journey.spec.js e2e/email-verification-journey.spec.js
```

Expected: PASS with no token in browser console, DOM snapshots, or response bodies beyond the submitted request.

- [ ] **Step 4: Commit the verification coverage**

```powershell
git add src/backend/test src/frontend/e2e
git commit -m "test(auth): cover recovery and verification journeys"
```
