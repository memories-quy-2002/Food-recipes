# Food Recipes Auth and Security Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Move browser access tokens to memory-only storage, preserve refresh-session semantics and remember-me behavior, expose secure recovery flows, and prove role/ownership boundaries with API and browser tests.

**Architecture:** NestJS remains the source of truth for identity, refresh sessions, recovery tokens, roles, and ownership. React keeps only user metadata in Redux, stores the short-lived access token in a module-scoped memory store, and uses the existing HttpOnly \`food_refresh\` cookie for boot hydration and refresh rotation. The change is additive and keeps the backend refresh body compatibility bridge during migration.

**Tech Stack:** React, Redux Toolkit, React Router, Axios, Vitest, Playwright, NestJS, Passport JWT, Jest, Supertest-compatible API tests, Prisma 7, and PostgreSQL.

## Global Constraints

- Work on \`codex/auth-security-foundation\`; do not modify \`master\` directly.
- Never store access or refresh tokens in \`localStorage\`, \`sessionStorage\`, Redux, TanStack Query caches, URLs, logs, screenshots, or telemetry.
- Preserve \`remember\`: persistent login uses a persistent refresh cookie; an unremembered login uses a session cookie; rotation preserves the choice.
- Preserve login, signup, refresh, logout, protected-route, and auth return-intent behavior.
- Keep \`AuthThrottleGuard\` on recovery and token-consuming routes.
- Never reveal account existence, raw recovery tokens, passwords, webhook secrets, or raw delivery failures.
- Enforce authorization in backend services/controllers; frontend guards are UX only.
- Use test-first cycles: write a focused failing test, confirm the expected failure, implement the smallest change, then run focused and affected suites.
- Do not add an authentication provider, email provider, MFA, social login, Redis, or a new upload architecture.
- Use Conventional Commits and keep each task independently reviewable.

---

### Task 1: Preserve refresh-session persistence semantics

**Files:**

- Modify: \`src/backend/prisma/schema.prisma\`
- Create: \`src/backend/prisma/migrations/20260825100000_add_auth_session_persistence/migration.sql\`
- Modify: \`src/backend/src/modules/auth/dto/login.dto.ts\`
- Modify: \`src/backend/src/modules/auth/auth-session.repository.ts\`
- Modify: \`src/backend/src/modules/auth/auth.service.ts\`
- Modify: \`src/backend/src/modules/auth/auth.controller.ts\`
- Modify: \`src/backend/src/modules/auth/auth.service.spec.ts\`
- Create: \`src/backend/src/modules/auth/auth.controller.spec.ts\`

**Interfaces:**

- \`LoginDto.remember?: boolean\`, defaulting to \`false\` for login.
- \`createSession(userId, expiresInDays, persistent): Promise<string>\`.
- \`rotateSession(refreshToken, expiresInDays): Promise<{ userId, refreshToken, persistent } | null>\`.
- Public auth JSON remains \`{ user, token, message }\`; refresh tokens and persistence metadata never appear in JSON.

- [ ] **Step 1: Write failing persistence and cookie tests.** Test remembered versus session-only login, persistence-preserving rotation, cookie flags, \`maxAge\`, and absence of \`refreshToken\` from the response body.
- [ ] **Step 2: Run the focused tests and verify failure.** Run \`cd src/backend; corepack pnpm@11.18.0 exec jest src/modules/auth/auth.service.spec.ts src/modules/auth/auth.controller.spec.ts --runInBand\`; the new assertions should fail because persistence is not modeled.
- [ ] **Step 3: Add the Prisma field and migration.** Add \`persistent Boolean @default(true) @map("persistent")\` to \`AuthSession\`. Create a forward-only migration containing \`ALTER TABLE auth_sessions ADD COLUMN persistent BOOLEAN NOT NULL DEFAULT TRUE;\`; never reset existing migrations.
- [ ] **Step 4: Implement the backend contract.** Pass \`dto.remember ?? false\` from login, use \`true\` for signup, preserve the flag during rotation, and omit cookie \`maxAge\` for a session cookie. Keep the refresh body DTO compatibility path but strip refresh fields from \`publicAuthResponse\`.
- [ ] **Step 5: Verify.** Run \`corepack pnpm@11.18.0 exec jest src/modules/auth/auth.service.spec.ts src/modules/auth/auth.controller.spec.ts --runInBand\`, \`corepack pnpm@11.18.0 prisma:validate\`, and \`corepack pnpm@11.18.0 run typecheck\`.
- [ ] **Step 6: Commit.** Run \`git add src/backend/prisma src/backend/src/modules/auth; git commit -m "fix(auth): preserve refresh session persistence"\`.

### Task 2: Introduce a memory-only frontend access-token boundary

**Files:**

- Create: \`src/frontend/features/auth/state/authTokenStore.js\`
- Create: \`src/frontend/features/auth/state/authTokenStore.test.js\`
- Modify: \`src/frontend/features/auth/state/authSlice.jsx\`
- Modify: \`src/frontend/features/auth/hooks/useLoginForm.js\`
- Modify: \`src/frontend/features/auth/hooks/useSignupForm.js\`
- Modify: \`src/frontend/shared/api/config.js\`
- Modify: \`src/frontend/shared/api/apiClient.test.js\`

**Interfaces:**

- \`getAccessToken(): string | null\`
- \`setAccessToken(token: string): void\`
- \`clearAccessToken(): void\`
- Login/restore reducers receive \`{ user }\` and never receive a token.

- [ ] **Step 1: Write failing tests.** Prove the token store never touches browser storage, the Axios request uses the memory token, and a stored \`jwt\` is ignored.
- [ ] **Step 2: Run focused tests.** Run \`cd src/frontend; corepack pnpm@11.18.0 exec vitest run features/auth/state/authTokenStore.test.js shared/api/apiClient.test.js\`; confirm failure before implementation.
- [ ] **Step 3: Implement the store.** Use only a module variable:
  ~~~js
  let accessToken = null;
  export const getAccessToken = () => accessToken;
  export const setAccessToken = (token) => { accessToken = token || null; };
  export const clearAccessToken = () => { accessToken = null; };
  ~~~
- [ ] **Step 4: Remove JWT persistence.** Keep the existing local/session user metadata shape for consumers, remove token reads/writes and all \`jwt\` writes, and call \`setAccessToken(response.data.token)\` in login/signup before dispatching user-only actions. Logout clears memory. The \`remember\` field remains in the login payload.
- [ ] **Step 5: Verify.** Run the focused Vitest suite and search with \`rg -n 'setItem\\(["'']jwt|setItem\\(["'']refresh|token.*localStorage|token.*sessionStorage' src/frontend\`; no new JWT persistence write may remain.
- [ ] **Step 6: Commit.** Run \`git add src/frontend/features/auth src/frontend/shared/api/config.js src/frontend/shared/api/apiClient.test.js; git commit -m "fix(auth): keep access tokens in memory"\`.

### Task 3: Complete refresh bootstrap, logout, and protected-route UX

**Files:**

- Modify: \`src/frontend/shared/api/axios.js\`
- Modify: \`src/frontend/shared/api/routes.js\`
- Create: \`src/frontend/features/auth/api/authSessionApi.js\`
- Create: \`src/frontend/features/auth/api/authSessionApi.test.js\`
- Modify: \`src/frontend/app/AuthProvider.jsx\`
- Modify: \`src/frontend/features/auth/state/authSlice.jsx\`
- Modify: \`src/frontend/features/auth/components/ProtectedRoute.jsx\`
- Modify: \`src/frontend/shared/layout/HeaderAuthButton.jsx\`
- Modify: \`src/frontend/shared/layout/HeaderToggle.jsx\`
- Modify: \`src/frontend/features/profile/Profile.jsx\`
- Modify: \`src/frontend/shared/api/apiClient.test.js\`

**Interfaces:**

- \`authSessionApi.logout(): Promise<void>\`.
- \`authSessionApi.refresh(): Promise<{ user: PublicUser; token: string }>\`.
- Auth state exposes \`hydrated: boolean\`.

- [ ] **Step 1: Write failing tests.** Cover refresh-cookie boot hydration, protected-route waiting, server logout before local clear, and one shared refresh request for concurrent 401 responses.
- [ ] **Step 2: Run focused tests.** Run \`cd src/frontend; corepack pnpm@11.18.0 exec vitest run app/AuthProvider.test.jsx features/auth/components/ProtectedRoute.test.jsx features/auth/api/authSessionApi.test.js shared/api/apiClient.test.js\`; confirm the expected missing behavior.
- [ ] **Step 3: Update Axios lifecycle.** Read \`getAccessToken()\` for headers, write refresh responses through \`setAccessToken()\`, share one \`refreshPromise\`, skip recursion for \`/auth/refresh\`, retry the original request once, and emit \`auth:expired\` only after refresh failure.
- [ ] **Step 4: Implement boot hydration.** On mount, call refresh once, set memory token, restore returned user, and mark \`hydrated: true\` on both success and failure. ProtectedRoute renders an accessible loading status until hydration resolves.
- [ ] **Step 5: Route sign-out through the server.** Add a logout thunk/helper that calls \`/auth/logout\` and dispatches the synchronous clear action in \`finally\`. Update header/profile controls and avoid logout loops from \`auth:expired\`.
- [ ] **Step 6: Verify.** Run the focused Vitest suite, \`corepack pnpm@11.18.0 run lint\`, \`corepack pnpm@11.18.0 run typecheck\`, and the affected header navigation tests.
- [ ] **Step 7: Commit.** Run \`git add src/frontend/app src/frontend/features/auth src/frontend/shared/api src/frontend/shared/layout src/frontend/features/profile/Profile.jsx; git commit -m "feat(auth): hydrate sessions through refresh cookies"\`.

### Task 4: Add accessible password recovery and email verification UI

**Files:**

- Create: \`src/frontend/features/auth/api/passwordRecoveryApi.ts\`
- Create: \`src/frontend/features/auth/api/passwordRecoveryApi.test.ts\`
- Create: \`src/frontend/features/auth/components/ForgotPasswordForm.jsx\`
- Create: \`src/frontend/features/auth/components/ForgotPasswordForm.test.jsx\`
- Create: \`src/frontend/features/auth/ResetPassword.jsx\`
- Create: \`src/frontend/features/auth/ResetPassword.test.jsx\`
- Create: \`src/frontend/features/auth/VerifyEmail.jsx\`
- Create: \`src/frontend/features/auth/VerifyEmail.test.jsx\`
- Modify: \`src/frontend/shared/api/routes.js\`
- Modify: \`src/frontend/shared/api/contracts.ts\`
- Modify: \`src/frontend/features/auth/components/AccountForm.jsx\`
- Modify: \`src/frontend/features/auth/components/LoginForm.jsx\`
- Modify: \`src/frontend/app/AppRoutes.jsx\`
- Modify: \`src/frontend/app/AuthProvider.jsx\`

**Interfaces:**

- \`requestPasswordReset(email): Promise<MessageResponse>\`.
- \`resetPassword(token, newPassword): Promise<MessageResponse>\`.
- \`verifyEmail(token): Promise<MessageResponse>\`.
- \`resendVerification(): Promise<MessageResponse>\`.

- [ ] **Step 1: Write failing tests.** Assert exact API methods/paths/bodies, generic recovery copy, labels and \`aria-describedby\`, pending states, missing-token handling, live status regions, and that token text is not rendered.
- [ ] **Step 2: Run focused tests.** Run \`cd src/frontend; corepack pnpm@11.18.0 exec vitest run features/auth/api/passwordRecoveryApi.test.ts features/auth/components/ForgotPasswordForm.test.jsx features/auth/ResetPassword.test.jsx features/auth/VerifyEmail.test.jsx\`.
- [ ] **Step 3: Implement typed APIs and forms.** Use \`useSearchParams\` only to read the token at submit time; validate missing tokens before network calls; show generic success and safe actionable errors; preserve keyboard, mobile, and password-manager behavior.
- [ ] **Step 4: Integrate routes and reminder.** Add the forgot link, \`/account/reset-password\`, \`/account/verify-email\`, and a dismissible resend reminder for authenticated users with \`email_verified === false\`.
- [ ] **Step 5: Verify and commit.** Run the focused Vitest suite, lint, and typecheck, then commit with \`git add src/frontend/features/auth src/frontend/app/AppRoutes.jsx src/frontend/shared/api/routes.js src/frontend/shared/api/contracts.ts; git commit -m "feat(auth): add recovery and verification flows"\`.

### Task 5: Prove backend role and ownership boundaries

**Files:**

- Create: \`src/backend/src/modules/auth/guards/roles.guard.spec.ts\`
- Modify: \`src/backend/src/modules/auth/auth.service.spec.ts\`
- Modify: \`src/backend/src/modules/reports/reports.service.spec.ts\`
- Modify: \`src/backend/src/modules/recipes/recipes.service.spec.ts\`
- Modify: \`src/backend/src/modules/collections/collections.service.spec.ts\`
- Modify: \`src/backend/src/modules/planning/planning.service.spec.ts\`
- Modify: \`src/backend/src/modules/pantry/pantry.service.spec.ts\`
- Create: \`src/backend/test/auth-security.validation.mjs\`

- [ ] **Step 1: Add failing boundary assertions.** Cover non-admin rejection by RolesGuard, missing actor rejection, cross-user recipe mutation rejection, user-scoped collections/planning/shopping/pantry queries, and recovery errors without raw tokens or account existence details.
- [ ] **Step 2: Run focused tests.** Run \`cd src/backend; corepack pnpm@11.18.0 exec jest src/modules/auth/guards/roles.guard.spec.ts src/modules/auth/auth.service.spec.ts src/modules/reports/reports.service.spec.ts src/modules/recipes/recipes.service.spec.ts src/modules/collections/collections.service.spec.ts src/modules/planning/planning.service.spec.ts src/modules/pantry/pantry.service.spec.ts --runInBand\`. Fix only the responsible backend boundary when a test exposes a gap.
- [ ] **Step 3: Add static security validation.** Fail when frontend production code writes \`jwt\`, \`refreshToken\`, \`password\`, or recovery tokens to browser storage; when auth public JSON returns refresh tokens; or when recovery delivery logs sensitive values. Pass the intentional server-side compatibility bridge.
- [ ] **Step 4: Verify and commit.** Run \`corepack pnpm@11.18.0 exec node test/auth-security.validation.mjs\`, backend check, and build, then commit with \`git add src/backend/src/modules src/backend/test/auth-security.validation.mjs; git commit -m "test(auth): verify role and ownership boundaries"\`.

### Task 6: Add browser journeys and perform final runtime verification

**Files:**

- Create: \`src/frontend/e2e/auth-session-journey.spec.js\`
- Create: \`src/frontend/e2e/password-recovery-journey.spec.js\`
- Create: \`src/frontend/e2e/email-verification-journey.spec.js\`
- Modify: \`src/frontend/e2e/playwright.config.js\` only if the existing preview setup cannot serve the new routes.

- [ ] **Step 1: Write journeys.** Cover both remember modes, protected-route hydration, expired access token followed by one refresh/retry, logout, generic forgot-password success, invalid reset token, verification success/failure, resend pending state, mobile layout, and keyboard labels. Mock only delivery; do not expose recovery tokens in assertions or screenshots.
- [ ] **Step 2: Run targeted Playwright tests.** Run \`cd src/frontend; corepack pnpm@11.18.0 test:e2e:ci -- e2e/auth-session-journey.spec.js e2e/password-recovery-journey.spec.js e2e/email-verification-journey.spec.js\`.
- [ ] **Step 3: Use CLI and in-app Browser smoke.** Verify \`npx\` is available, start the frontend preview and required API, use the bundled Playwright CLI to navigate/snapshot the account, reset, verification, and protected states, then use the in-app Browser skill for the visible local smoke pass. Store optional artifacts under \`output/playwright/\`.
- [ ] **Step 4: Run all gates.** Run backend check/build/Prisma validate, frontend check/build, and the complete frontend Playwright suite.
- [ ] **Step 5: Run hygiene checks.** Run commitlint from the branch base to HEAD, \`git diff --check\`, \`git status --short\`, and inspect the final diff for secrets, unrelated changes, and JWT storage writes.
- [ ] **Step 6: Commit browser coverage.** Run \`git add src/frontend/e2e; git commit -m "test(auth): cover secure browser sessions"\`.

## Final review checklist

- [ ] JWT and refresh tokens never enter browser storage or Redux.
- [ ] Remembered and session-only cookies differ and rotation preserves the choice.
- [ ] Refresh bootstrap, concurrent 401 recovery, logout, and protected-route hydration are covered.
- [ ] Recovery and verification flows are accessible and token-safe.
- [ ] Role and ownership boundaries are enforced server-side and tested.
- [ ] Backend/frontend checks and builds pass.
- [ ] Playwright and real browser smoke evidence are recorded.
- [ ] Commit-lint and diff hygiene pass.
