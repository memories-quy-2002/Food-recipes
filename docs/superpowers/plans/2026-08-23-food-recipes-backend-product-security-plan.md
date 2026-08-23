# Food Recipes Backend Product and Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the backend-only P1 core APIs, P2 planning APIs, and security hardening while leaving `src/frontend/` unchanged.

**Architecture:** Extend the existing Nest module/repository/service/controller structure. Use additive PostgreSQL migrations and parameterized Prisma raw SQL for legacy-compatible tables. Keep actor identity server-owned through the JWT guard and expose stable versioned routes under `/api/v1`.

**Tech Stack:** NestJS 11, TypeScript, Prisma 7, PostgreSQL, Jest, Supertest, Kong, Node 24.

**Spec:** `docs/superpowers/specs/2026-08-23-food-recipes-p1-core-product-design.md`, `docs/superpowers/specs/2026-08-23-food-recipes-p2-planning-design.md`, and `docs/superpowers/specs/2026-08-23-food-recipes-security-hardening-design.md`

## Global Constraints

- Do not modify `src/frontend/` in this implementation slice.
- Do not run `prisma migrate reset` or rewrite the existing data-bearing baseline.
- Use `corepack pnpm@11.18.0` for backend commands.
- Use the authenticated JWT subject for ownership; never accept a client-owned user ID for protected mutations.
- Keep controllers thin and put business rules in services/repositories.
- Use parameterized Prisma SQL for legacy tables and validate every external DTO.
- Do not expose secrets, passwords, refresh tokens, or authorization headers in logs or responses.
- Additive migrations must remain deployable against the current PostgreSQL baseline.

---

### Task 1: P1 collections and review-report persistence/API

**Files:**
- Create: `src/backend/apps/api/prisma/migrations/20260823130000_add_collections_and_review_reports/migration.sql`
- Modify: `src/backend/apps/api/prisma/schema.prisma`
- Create: `src/backend/apps/api/src/modules/collections/collections.module.ts`
- Create: `src/backend/apps/api/src/modules/collections/collections.controller.ts`
- Create: `src/backend/apps/api/src/modules/collections/collections.service.ts`
- Create: `src/backend/apps/api/src/modules/collections/collections.repository.ts`
- Create: `src/backend/apps/api/src/modules/collections/dto/*.ts`
- Create: `src/backend/apps/api/src/modules/reports/reports.module.ts`
- Create: `src/backend/apps/api/src/modules/reports/reports.controller.ts`
- Create: `src/backend/apps/api/src/modules/reports/reports.service.ts`
- Create: `src/backend/apps/api/src/modules/reports/reports.repository.ts`
- Create: `src/backend/apps/api/src/modules/reports/dto/*.ts`
- Modify: `src/backend/apps/api/src/app.module.ts`
- Modify: `src/backend/apps/api/src/common/swagger/response.schemas.ts`
- Test: module service, repository, controller, and HTTP contract specs beside each module

**Interfaces:**
- Collection routes: `GET/POST /users/me/collections`, `PATCH/DELETE /users/me/collections/:collectionId`, and add/remove recipe routes exactly as defined in the P1 spec.
- Report route: `POST /recipes/:recipeId/reviews/:ratingId/report` with `reason` and optional `details`.
- Repository methods must accept `userId` explicitly from the service and return ownership-safe 404 results for foreign resources.

- [ ] **Step 1: Add the additive migration and Prisma table representations.**

Create `saved_collections`, `saved_collection_items`, and `review_reports` with the unique keys and check constraints from the P1 spec. Add matching scalar Prisma models mapped to the legacy table names without changing existing tables.

- [ ] **Step 2: Write failing service/repository tests.**

Cover collection name trimming/length, duplicate names, foreign collection access, duplicate recipe membership, missing recipes, report recipe-rating ownership, duplicate open reports, and report detail length.

- [ ] **Step 3: Implement repositories and services.**

Use `Prisma.sql` parameters for all IDs and strings. Use `INSERT ... ON CONFLICT` for idempotent membership checks, but return a stable conflict error for duplicate open reports and collection names.

- [ ] **Step 4: Implement guarded controllers and Swagger DTOs.**

Apply `JwtAuthGuard`, `CurrentUser`, `ParseIntPipe`, DTO validation, explicit 401/404/409 responses, and response schemas. Keep report moderation admin-only until Task 3 provides the role guard; the user report-write route is available to authenticated users.

- [ ] **Step 5: Verify the task.**

Run:

```text
corepack pnpm@11.18.0 --filter @food-recipes/api typecheck
corepack pnpm@11.18.0 --filter @food-recipes/api test:ci -- --runInBand
corepack pnpm@11.18.0 --filter @food-recipes/api prisma:validate
```

Expected: exit code 0, all existing suites plus the new focused suites pass, and Prisma validates without a database connection.

### Task 2: P2 meal-plan and shopping-list APIs

**Files:**
- Create: `src/backend/apps/api/prisma/migrations/20260823133000_add_planning_tables/migration.sql`
- Modify: `src/backend/apps/api/prisma/schema.prisma`
- Create: `src/backend/apps/api/src/modules/planning/planning.module.ts`
- Create: `src/backend/apps/api/src/modules/planning/planning.controller.ts`
- Create: `src/backend/apps/api/src/modules/planning/planning.service.ts`
- Create: `src/backend/apps/api/src/modules/planning/planning.repository.ts`
- Create: `src/backend/apps/api/src/modules/planning/dto/*.ts`
- Modify: `src/backend/apps/api/src/app.module.ts`
- Modify: `src/backend/apps/api/src/common/swagger/response.schemas.ts`
- Test: `src/backend/apps/api/src/modules/planning/*.spec.ts` and `src/backend/apps/api/test/planning.e2e-spec.ts`

**Interfaces:**
- Meal-plan routes and shopping-list routes must match the P2 spec exactly.
- Every repository method takes `userId` before resource IDs and scopes the SQL predicate to that user.
- Date inputs are ISO dates, plan range is inclusive and at most 31 days, slots are `breakfast|lunch|dinner|snack`, and servings are 1-24.

- [ ] **Step 1: Add planning tables and constraints.**

Create `meal_plans`, `meal_plan_items`, and `shopping_list_items` with owner foreign keys, date/slot/servings checks, and the indexes from the P2 spec. Add matching Prisma scalar models.

- [ ] **Step 2: Write failing DTO and service tests.**

Cover invalid date ranges, invalid slots/servings, missing recipes, foreign plan/item access, label/quantity limits, and clear-completed behavior.

- [ ] **Step 3: Implement repository queries.**

Return plan items ordered by date/slot and shopping items ordered by checked state then creation time. `from-recipe` copies each existing ingredient string as a separate line and never merges free-text quantities.

- [ ] **Step 4: Implement controller/service/Swagger wiring.**

Use the current validation pipe and authentication guard. Return 201 for creates, 200 for updates/lists, 204 for deletes where the existing API convention uses no content, and stable 404 responses for foreign resources.

- [ ] **Step 5: Verify the task.**

Run:

```text
corepack pnpm@11.18.0 --filter @food-recipes/api typecheck
corepack pnpm@11.18.0 --filter @food-recipes/api test:ci -- --runInBand
corepack pnpm@11.18.0 --filter @food-recipes/api prisma:validate
```

Expected: exit code 0 and no change to existing recipe/wishlist/rating tests.

### Task 3: Session, role, and recovery security

**Files:**
- Create: `src/backend/apps/api/prisma/migrations/20260823140000_add_auth_sessions_roles_and_recovery/migration.sql`
- Modify: `src/backend/apps/api/prisma/schema.prisma`
- Modify: `src/backend/apps/api/src/modules/auth/auth.service.ts`
- Modify: `src/backend/apps/api/src/modules/auth/auth.controller.ts`
- Modify: `src/backend/apps/api/src/modules/auth/auth.module.ts`
- Modify: `src/backend/apps/api/src/modules/auth/strategies/jwt.strategy.ts`
- Modify: `src/backend/apps/api/src/modules/auth/types/auth-user.type.ts`
- Create: `src/backend/apps/api/src/modules/auth/guards/roles.guard.ts`
- Create: `src/backend/apps/api/src/common/decorators/roles.decorator.ts`
- Create: `src/backend/apps/api/src/modules/auth/dto/refresh-token.dto.ts`
- Create: `src/backend/apps/api/src/modules/auth/dto/password-recovery.dto.ts`
- Create: `src/backend/apps/api/src/modules/auth/auth-session.repository.ts`
- Modify: `src/backend/apps/api/src/modules/users/users.repository.ts`
- Modify: `src/backend/apps/api/src/modules/users/users.service.ts`
- Modify: `src/backend/apps/api/src/common/swagger/response.schemas.ts`
- Test: auth service/controller/strategy/guard specs and `src/backend/apps/api/test/auth-security.e2e-spec.ts`

**Interfaces:**
- Add `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `POST /auth/verify-email`, and `POST /auth/resend-verification`.
- Access JWTs are short-lived and refresh tokens are opaque, hashed, rotated, and revoked server-side.
- Public auth responses remain compatible during migration, but no token is logged or returned by recovery endpoints.
- `@Roles('admin')` and `RolesGuard` are the only path to admin endpoints.

- [ ] **Step 1: Add auth session, role, and single-use token tables.**

Add `accounts.role` with a `user|admin` check, `auth_sessions`, `password_reset_tokens`, and `email_verification_tokens`. Use hashed token columns, expiry timestamps, consumed/revoked timestamps, and indexes for lookup/expiry cleanup.

- [ ] **Step 2: Write failing rotation and recovery tests.**

Cover refresh success, rotation invalidating the previous token, reuse revoking a session family, logout revocation, generic forgot-password responses, expired/consumed reset tokens, verification token consumption, and role guard denial for non-admin users.

- [ ] **Step 3: Implement the session repository and auth service.**

Generate opaque values with `randomBytes`, store only SHA-256 hashes, sign access JWTs with the configured short expiry, set/clear HttpOnly refresh cookies in the controller, and use a single generic response for unknown recovery emails.

- [ ] **Step 4: Add roles to the authenticated request without trusting client claims.**

Load the current role server-side for the JWT subject, expose it on `AuthUser`, and make `RolesGuard` compare the required role to the server-owned value. Do not accept a role from signup/login DTOs.

- [ ] **Step 5: Verify the task.**

Run:

```text
corepack pnpm@11.18.0 --filter @food-recipes/api typecheck
corepack pnpm@11.18.0 --filter @food-recipes/api test:ci -- --runInBand
corepack pnpm@11.18.0 --filter @food-recipes/api prisma:validate
```

Expected: exit code 0; existing login, signup, JWT, and ownership tests remain green.

### Task 4: API headers, body limits, throttling, and media upload grants

**Files:**
- Modify: `src/backend/apps/api/src/main.ts`
- Modify: `src/backend/apps/api/src/bootstrap/cors.bootstrap.ts`
- Create: `src/backend/apps/api/src/common/security/auth-throttle.service.ts`
- Create: `src/backend/apps/api/src/common/security/auth-throttle.guard.ts`
- Create: `src/backend/apps/api/src/modules/media/media.module.ts`
- Create: `src/backend/apps/api/src/modules/media/media.controller.ts`
- Create: `src/backend/apps/api/src/modules/media/media.service.ts`
- Create: `src/backend/apps/api/src/modules/media/dto/create-recipe-image-upload.dto.ts`
- Modify: `src/backend/apps/api/src/app.module.ts`
- Modify: `src/backend/apps/api/src/common/interceptors/logging.interceptor.ts`
- Modify: `.github/workflows/quality-gates.yml`
- Test: bootstrap/security/media specs and `src/backend/apps/api/test/media.e2e-spec.ts`

**Interfaces:**
- `POST /api/v1/media/recipe-image/upload-url` is authenticated and validates filename, MIME type, and size before issuing a short-lived grant.
- Login, signup, refresh, and recovery routes share a bounded per-IP/per-email throttle with deterministic 429 responses.
- No sensitive header/cookie/body field is included in structured logs.

- [ ] **Step 1: Write failing bootstrap and throttle tests.**

Assert security headers, explicit JSON body limits, CORS rejection of wildcard origins with credentials, stable 429 responses, and redaction of authorization/cookie/password fields from logs.

- [ ] **Step 2: Implement security bootstrap controls.**

Set `X-Content-Type-Options`, frame protection, referrer policy, a repository-compatible CSP, and disable fingerprinting. Configure explicit JSON/urlencoded limits and preserve existing request IDs and validation behavior.

- [ ] **Step 3: Implement the in-process auth throttle.**

Use a bounded map with expiration and cleanup. Key failures by normalized email plus IP and by IP globally. Reset the email failure counter only after successful authentication. Keep the implementation stateless-compatible and document that Kong remains the distributed edge limit.

- [ ] **Step 4: Implement authenticated upload grants.**

Add an abstraction for the storage signer rather than embedding a service-role key in the controller. Reject non-image MIME types, files above 5 MiB, unsafe filenames, and missing metadata. Return an object path and expiry without returning credentials.

- [ ] **Step 5: Add dependency audit to CI.**

Run the package-manager audit for the backend workspace with a high/critical failure threshold and keep the command in the backend quality workflow without exposing registry credentials.

- [ ] **Step 6: Verify the task.**

Run:

```text
corepack pnpm@11.18.0 --filter @food-recipes/api typecheck
corepack pnpm@11.18.0 --filter @food-recipes/api test:ci -- --runInBand
node src/backend/apps/api/test/ci-workflow.validation.mjs
node src/backend/apps/api/test/docker-infrastructure.validation.mjs
```

Expected: exit code 0 and no sensitive values in captured test logs.

### Task 5: Backend contract verification and handoff

**Files:**
- Modify: `docs/backend/current-api-contract.md`
- Create: `src/backend/apps/api/test/backend-product-security.validation.mjs`
- Modify: `src/backend/apps/api/test/ci-workflow.validation.mjs`
- Modify: `src/backend/apps/api/src/bootstrap/swagger.bootstrap.spec.ts`

- [ ] **Step 1: Add a DB-free route and schema validator.**

Check that every new controller is mounted under version 1, every protected mutation has bearer security metadata, and new request DTOs reject unknown fields.

- [ ] **Step 2: Extend the API contract document.**

Document the new backend routes, status codes, ownership rules, deprecation of `/auth/token`, upload-grant limits, and the fact that frontend consumers are intentionally deferred.

- [ ] **Step 3: Run the complete backend gate.**

Run:

```text
corepack pnpm@11.18.0 --filter @food-recipes/api check
corepack pnpm@11.18.0 --filter @food-recipes/api build
corepack pnpm@11.18.0 --filter @food-recipes/api prisma:validate
node src/backend/apps/api/test/backend-product-security.validation.mjs
```

Expected: all commands exit 0. Do not claim live PostgreSQL migration success unless a real disposable database is available and verified.

- [ ] **Step 4: Commit only backend implementation and its contract/plan artifacts.**

Use a Conventional Commit message and leave all pre-existing unrelated dirty files unstaged. Do not push to origin.
