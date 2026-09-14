# Food Recipes Backend Modernization Implementation Plan

> **Execution note (2026-08-23):** This plan was originally drafted with an
> `apps/api` package. Per the repository layout decision, the NestJS API is now
> implemented directly in `src/backend/`; references to `apps/api/` below mean
> the corresponding `src/backend/` path. The legacy `src/server` references
> remain historical migration evidence. Frontend cutover tasks are intentionally
> not executed in this backend-only phase.

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy Express backend with a production-oriented NestJS modular monolith using TypeScript, Prisma/PostgreSQL, Swagger/OpenAPI, Kong Gateway, Docker Compose, JWT authentication, structured error handling, and automated tests without breaking the existing frontend during migration.

**Architecture:** Build a new NestJS API in parallel with the legacy Express server and migrate feature-by-feature. Keep HTTP, business logic, persistence, and infrastructure concerns separated using `controller -> service -> repository -> PrismaService`. Route production traffic through Kong only after API parity and frontend regression tests pass.

**Tech Stack:** Node.js 24, TypeScript, NestJS, Prisma 7, PostgreSQL, JWT, Passport, Swagger/OpenAPI, Kong DB-less, Docker, Docker Compose, pnpm, Jest, Supertest.

**Spec:** Existing `Food-recipes` repository behavior plus the agreed backend architecture and API migration plan.

**Execution status:** Backend tasks 1–16, 18, 19, and 20 are implemented in the
current tree and verified with the backend gates. Task 17 and live frontend
regression remain deferred because this phase is backend-only. Database baseline
resolution and migration deployment remain operator-gated as documented in
`src/backend/README.prisma.md`.

## Global Constraints

- Preserve existing Express behavior until the corresponding NestJS module has passing parity tests.
- Do not delete `src/server` until the frontend has cut over successfully.
- Final public REST prefix is `/api/v1`.
- Use Prisma 7, not Prisma 8 RC.
- Never run `prisma migrate reset` against the current data-bearing database.
- Baseline the existing PostgreSQL database before Prisma Migrate owns future migrations.
- Do not require Kong for local unit tests.
- Authentication and authorization belong in NestJS, not duplicated in Kong.
- Kong owns routing, rate limiting, request correlation, and gateway-level policies.
- Production database changes use `prisma migrate deploy` from CI/release automation.
- Do not introduce Kafka, Redis, RabbitMQ, Kubernetes, CQRS, Saga, or microservices in this migration.
- Protected resource ownership must be derived from the authenticated user, not trusted from `:userId` route parameters.
- Every task must end in independently verifiable behavior and a focused commit.

---

## Target Backend Structure

```text
src/backend/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── bootstrap/
│   │   ├── cors.bootstrap.ts
│   │   ├── swagger.bootstrap.ts
│   │   └── validation.bootstrap.ts
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── auth.config.ts
│   │   ├── database.config.ts
│   │   └── env.validation.ts
│   ├── common/
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── middleware/
│   │   └── types/
│   ├── infrastructure/
│   │   └── prisma/
│   │       ├── prisma.module.ts
│   │       └── prisma.service.ts
│   └── modules/
│       ├── auth/
│       ├── users/
│       ├── recipes/
│       ├── taxonomy/
│       ├── wishlist/
│       ├── ratings/
│       └── health/
├── test/
├── Dockerfile
├── nest-cli.json
├── prisma.config.ts
├── tsconfig.json
└── package.json

infrastructure/
├── kong/
│   └── kong.yml
└── docker/
    ├── docker-compose.yml
    └── docker-compose.dev.yml
```

---

## Task 1: Capture Legacy API Contract

**Files:**
- Create: `docs/backend/current-api-contract.md`
- Inspect: `src/client/shared/api/routes.js`
- Inspect: `src/server/routes.js`
- Inspect: `src/server/queries.js`

**Produces:**
- A frozen list of current endpoints, request bodies, response shapes, and status codes.
- A migration checklist mapping every Express route to a future NestJS route.

- [ ] Document current auth endpoints:
  - `POST /auth/login`
  - `POST /auth/signup`
  - `POST /auth/token`
- [ ] Document recipe endpoints:
  - `GET /recipes`
  - `GET /recipes/:rid`
  - `GET /users/:uid/recipes`
  - `POST /recipes`
  - `DELETE /recipes/:rid`
- [ ] Document taxonomy, wishlist, rating, review, user profile, password, and health endpoints.
- [ ] Record payload properties consumed by the frontend, especially `recipe_id`, `overall_score`, `num_ratings`, `user_id`, `prep_time`, and `cook_time`.
- [ ] Start the legacy app and manually verify at least login, recipe list, recipe detail, wishlist, and rating flows.
- [ ] Commit.

```bash
git add docs/backend/current-api-contract.md
git commit -m "docs: capture legacy backend API contract"
```

---

## Task 2: Bootstrap NestJS API

**Files:**
- Create: `apps/api/**`
- Create/Modify: `pnpm-workspace.yaml`
- Modify: root `package.json` only if workspace scripts are needed

**Produces:**
- `apps/api` compiles and starts independently.

- [ ] Scaffold NestJS with pnpm and without nested Git metadata.
- [ ] Add core dependencies:
  - `@nestjs/config`
  - `@nestjs/swagger`
  - `@nestjs/jwt`
  - `@nestjs/passport`
  - `passport`
  - `passport-jwt`
  - `class-validator`
  - `class-transformer`
  - `bcryptjs`
  - `@prisma/client@^7`
- [ ] Add dev dependencies:
  - `prisma@^7`
  - `@types/passport-jwt`
  - `supertest`
- [ ] Remove Nest demo controller/service.
- [ ] Add a minimal `GET /api/v1/health/live`.
- [ ] Run:

```bash
pnpm --dir apps/api lint
pnpm --dir apps/api test
pnpm --dir apps/api build
```

- [ ] Commit.

```bash
git commit -m "feat(api): bootstrap NestJS application"
```

---

## Task 3: Add Configuration, Validation, and Versioning

**Files:**
- Create: `apps/api/src/config/app.config.ts`
- Create: `apps/api/src/config/auth.config.ts`
- Create: `apps/api/src/config/database.config.ts`
- Create: `apps/api/src/config/env.validation.ts`
- Create: `apps/api/src/bootstrap/cors.bootstrap.ts`
- Create: `apps/api/src/bootstrap/validation.bootstrap.ts`
- Modify: `apps/api/src/main.ts`
- Modify: `apps/api/src/app.module.ts`
- Create: `.env.example`

**Produces:**
- Fail-fast environment validation.
- `/api/v1` URI versioning.
- Global DTO validation.
- Explicit CORS policy.

- [ ] Require `DATABASE_URL`, `JWT_SECRET`, and `PORT`.
- [ ] Configure `ValidationPipe` with:
  - `transform: true`
  - `whitelist: true`
  - `forbidNonWhitelisted: true`
- [ ] Enable URI versioning with default version `1`.
- [ ] Set global prefix `api`.
- [ ] Add `.env.example` with safe placeholders only.
- [ ] Add tests proving invalid DTO fields are rejected.
- [ ] Build and commit.

```bash
git commit -m "feat(api): add configuration and validation foundation"
```

---

## Task 4: Integrate Prisma with the Existing Database

**Files:**
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma.config.ts`
- Create: `apps/api/src/infrastructure/prisma/prisma.module.ts`
- Create: `apps/api/src/infrastructure/prisma/prisma.service.ts`
- Modify: `apps/api/src/app.module.ts`

**Produces:**
- Injectable Prisma client.
- Introspected schema mapped to application-friendly model names.

- [ ] Point Prisma at a development copy of the existing PostgreSQL database.
- [ ] Run:

```bash
cd apps/api
pnpm prisma db pull
pnpm prisma generate
```

- [ ] Map legacy tables without renaming them physically:
  - `accounts -> User`
  - `recipes -> Recipe`
  - `rating -> Rating`
  - `wishlist -> Wishlist`
  - `categories -> Category`
  - `meals -> Meal`
- [ ] Map legacy snake_case fields using `@map(...)`.
- [ ] Implement `PrismaService`.
- [ ] Add `PrismaModule` and export the client.
- [ ] Add a test proving the health service can execute `SELECT 1`.
- [ ] Commit.

```bash
git commit -m "feat(api): integrate Prisma with legacy PostgreSQL"
```

---

## Task 5: Baseline Prisma Migrate

**Files:**
- Create: `apps/api/prisma/migrations/0_init/migration.sql`

**Produces:**
- Prisma migration history starts from the existing schema without recreating it.

- [ ] Generate baseline SQL from the introspected schema.
- [ ] Review baseline SQL carefully; it must describe current state rather than destructively recreating live tables.
- [ ] Mark baseline as already applied on the development DB.
- [ ] Run `prisma migrate status`.
- [ ] Document the baseline procedure in `apps/api/README.md`.
- [ ] Commit.

```bash
git commit -m "chore(api): baseline existing database for Prisma Migrate"
```

---

## Task 6: Handle Legacy PostgreSQL Interval Fields Safely

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/src/modules/recipes/recipes.repository.ts` later reused by Recipe task
- Test: `apps/api/src/modules/recipes/recipes.repository.spec.ts`

**Produces:**
- NestJS can read/write recipe durations while Express still operates against the legacy `interval` columns.

- [ ] Do not change the production columns yet.
- [ ] Add typed raw-query methods that expose:
  - `prepTimeMinutes`
  - `cookTimeMinutes`
  - `totalTimeMinutes`
- [ ] Convert writes back to PostgreSQL intervals.
- [ ] Add tests for:
  - 15-minute prep
  - 1 hour 30 minute cook
  - correct total minute calculation
- [ ] Commit.

```bash
git commit -m "feat(api): bridge legacy interval recipe durations"
```

---

## Task 7: Add Health, Request Context, Logging, and Error Contracts

**Files:**
- Create: `apps/api/src/modules/health/*`
- Create: `apps/api/src/common/middleware/request-context.middleware.ts`
- Create: `apps/api/src/common/interceptors/logging.interceptor.ts`
- Create: `apps/api/src/common/filters/global-exception.filter.ts`
- Create: `apps/api/src/common/filters/prisma-exception.filter.ts`
- Create: `apps/api/src/common/types/api-error.type.ts`

**Produces:**
- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`
- Consistent API error envelope.
- Request IDs carried into logs.

**Error contract:**

```json
{
  "statusCode": 404,
  "code": "RECIPE_NOT_FOUND",
  "message": "Recipe not found",
  "requestId": "..."
}
```

- [ ] Map Prisma `P2002` to `409`.
- [ ] Map missing-resource errors to `404`.
- [ ] Never expose SQL, DB hostnames, secrets, or stack traces to the client.
- [ ] Add tests for readiness failure when DB is unavailable.
- [ ] Commit.

```bash
git commit -m "feat(api): add health logging and error handling"
```

---

## Task 8: Implement UsersModule

**Files:**
- Create: `apps/api/src/modules/users/users.module.ts`
- Create: `apps/api/src/modules/users/users.controller.ts`
- Create: `apps/api/src/modules/users/users.service.ts`
- Create: `apps/api/src/modules/users/users.repository.ts`
- Create: `apps/api/src/modules/users/dto/update-profile.dto.ts`
- Create: `apps/api/src/modules/users/dto/change-password.dto.ts`
- Test: `apps/api/src/modules/users/*.spec.ts`

**Repository interface:**

```ts
findById(id: number): Promise<User | null>;
findByEmail(email: string): Promise<User | null>;
create(data: CreateUserData): Promise<User>;
updateProfile(userId: number, dto: UpdateProfileDto): Promise<User>;
updatePasswordHash(userId: number, passwordHash: string): Promise<void>;
```

- [ ] Add profile update logic.
- [ ] Add current-password verification before password replacement.
- [ ] Never return password hashes from controller responses.
- [ ] Unit test service and repository behavior.
- [ ] Commit.

```bash
git commit -m "feat(api): implement users module"
```

---

## Task 9: Implement AuthModule

**Files:**
- Create: `apps/api/src/modules/auth/auth.module.ts`
- Create: `apps/api/src/modules/auth/auth.controller.ts`
- Create: `apps/api/src/modules/auth/auth.service.ts`
- Create: `apps/api/src/modules/auth/dto/login.dto.ts`
- Create: `apps/api/src/modules/auth/dto/signup.dto.ts`
- Create: `apps/api/src/modules/auth/strategies/jwt.strategy.ts`
- Create: `apps/api/src/common/guards/jwt-auth.guard.ts`
- Create: `apps/api/src/common/decorators/current-user.decorator.ts`
- Create: `apps/api/src/common/types/auth-user.type.ts`
- Test: `apps/api/test/auth.e2e-spec.ts`

**Final endpoints:**

```text
POST /api/v1/auth/signup
POST /api/v1/auth/login
GET  /api/v1/auth/me
```

- [ ] Hash passwords with bcrypt.
- [ ] Return JWT and sanitized user object.
- [ ] Reject duplicate email with `409`.
- [ ] Reject wrong password with `401`.
- [ ] Derive authenticated user ID from JWT.
- [ ] Add E2E tests:
  - valid signup
  - duplicate signup
  - valid login
  - invalid password
  - `auth/me` without token
  - `auth/me` with valid token
- [ ] Commit.

```bash
git commit -m "feat(api): implement JWT authentication"
```

---

## Task 10: Implement RecipesModule

**Files:**
- Create: `apps/api/src/modules/recipes/recipes.module.ts`
- Create: `apps/api/src/modules/recipes/recipes.controller.ts`
- Create: `apps/api/src/modules/recipes/recipes.service.ts`
- Complete: `apps/api/src/modules/recipes/recipes.repository.ts`
- Create: `apps/api/src/modules/recipes/dto/create-recipe.dto.ts`
- Create: `apps/api/src/modules/recipes/dto/update-recipe.dto.ts`
- Create: `apps/api/src/modules/recipes/dto/recipe-query.dto.ts`
- Test: `apps/api/test/recipes.e2e-spec.ts`

**Final endpoints:**

```text
GET    /api/v1/recipes
GET    /api/v1/recipes/:id
POST   /api/v1/recipes
PATCH  /api/v1/recipes/:id
DELETE /api/v1/recipes/:id
GET    /api/v1/users/me/recipes
```

- [ ] Support server-side query parameters:
  - `q`
  - `categoryId`
  - `mealId`
  - `sort`
  - `page`
  - `limit`
- [ ] Return normalized duration fields in minutes.
- [ ] Require JWT for create/update/delete.
- [ ] Enforce author ownership in service layer.
- [ ] Add `PATCH` to support the frontend's missing Edit Recipe feature.
- [ ] Add E2E tests for unauthorized create and forbidden delete/update of another user's recipe.
- [ ] Commit.

```bash
git commit -m "feat(api): implement recipes module"
```

---

## Task 11: Implement TaxonomyModule

**Files:**
- Create: `apps/api/src/modules/taxonomy/taxonomy.module.ts`
- Create: `apps/api/src/modules/taxonomy/categories/*`
- Create: `apps/api/src/modules/taxonomy/meals/*`

**Final endpoints:**

```text
GET /api/v1/categories
GET /api/v1/meals
```

**Business rule:**
- Categories and meal types are curated taxonomy.
- Recipe creation must reference an existing category and meal.
- Do not auto-create arbitrary taxonomy from recipe submissions.

- [ ] Add repositories and read services.
- [ ] Add validation that submitted category/meal IDs exist.
- [ ] Add tests for invalid taxonomy references.
- [ ] Commit.

```bash
git commit -m "feat(api): implement curated recipe taxonomy"
```

---

## Task 12: Implement Wishlist / Saved Recipes Module

**Files:**
- Create: `apps/api/src/modules/wishlist/*`
- Test: `apps/api/test/wishlist.e2e-spec.ts`

**Final endpoints:**

```text
GET    /api/v1/users/me/wishlist
POST   /api/v1/users/me/wishlist
DELETE /api/v1/users/me/wishlist/:recipeId
```

**Response item must include:**

```ts
{
  recipe: RecipeSummary;
  savedAt: string;
}
```

- [ ] Make add operation idempotent.
- [ ] Enforce unique `(user_id, recipe_id)`.
- [ ] Return `savedAt` so "Recently saved" can be implemented correctly.
- [ ] Never accept user identity from request body.
- [ ] Commit.

```bash
git commit -m "feat(api): implement saved recipes"
```

---

## Task 13: Implement Ratings and Reviews Module

**Files:**
- Create: `apps/api/src/modules/ratings/*`
- Test: `apps/api/test/ratings.e2e-spec.ts`

**Final endpoints:**

```text
PUT    /api/v1/recipes/:recipeId/rating
DELETE /api/v1/recipes/:recipeId/rating
GET    /api/v1/users/me/ratings
GET    /api/v1/recipes/:recipeId/reviews
```

**Business rules:**
- One rating per user per recipe.
- Score is integer `1..5`.
- Text review is optional.
- User may update/delete own review.
- Recipe author cannot rate own recipe.
- Review text has a bounded maximum length.
- Future moderation fields should be modeled without requiring a redesign.

- [ ] Implement upsert semantics.
- [ ] Reject self-review with `403`.
- [ ] Recompute aggregate score through query aggregation.
- [ ] Add tests for update, delete, self-review rejection, invalid score.
- [ ] Commit.

```bash
git commit -m "feat(api): implement trusted rating and review rules"
```

---

## Task 14: Add Swagger / OpenAPI

**Files:**
- Create: `apps/api/src/bootstrap/swagger.bootstrap.ts`
- Modify: controllers and DTOs in all public modules

**Produces:**
- `/docs`
- `/docs-json`

- [ ] Configure title, description, version, and bearer auth.
- [ ] Add `@ApiTags`, `@ApiOperation`, and response metadata to controllers.
- [ ] Annotate DTO fields.
- [ ] Verify `docs-json` contains every public `/api/v1` route.
- [ ] Commit.

```bash
git commit -m "feat(api): add Swagger OpenAPI documentation"
```

---

## Task 15: Containerize API and PostgreSQL

**Files:**
- Create: `apps/api/Dockerfile`
- Create: `apps/api/.dockerignore`
- Create: `infrastructure/docker/docker-compose.yml`
- Create: `infrastructure/docker/docker-compose.dev.yml`

**Produces:**
- Reproducible local stack.

- [ ] Use a multi-stage Node 24 image.
- [ ] Add PostgreSQL healthcheck.
- [ ] Keep API port internal where possible.
- [ ] Run migrations as an explicit one-shot compose service in local/staging.
- [ ] Verify:

```bash
docker compose -f infrastructure/docker/docker-compose.yml up --build
curl http://localhost:3000/api/v1/health/ready
```

- [ ] Commit.

```bash
git commit -m "build: containerize API and PostgreSQL"
```

---

## Task 16: Add Kong DB-less Gateway

**Files:**
- Create: `infrastructure/kong/kong.yml`
- Modify: `infrastructure/docker/docker-compose.yml`

**Produces:**
- Public gateway at port `8000`.
- NestJS API no longer needs direct public exposure.

**Kong responsibilities:**
- route `/api`
- route `/docs`
- rate limiting
- `X-Request-ID` correlation header

- [ ] Configure DB-less mode.
- [ ] Route Kong service target to `http://api:3000`.
- [ ] Add `correlation-id` plugin.
- [ ] Add conservative rate limiting.
- [ ] Verify:

```bash
curl -i http://localhost:8000/api/v1/health/live
```

Expected:
- `200`
- response includes request ID
- repeated requests eventually expose rate limit headers/policy behavior

- [ ] Commit.

```bash
git commit -m "feat(infra): add Kong API gateway"
```

---

## Task 17: Frontend API Cutover Support

**Files:**
- Coordinate with frontend plan:
  - `src/client/shared/api/axios.js`
  - `src/client/shared/api/routes.js`

**Produces:**
- Frontend talks to Kong using `/api/v1`.
- JWT sent as `Authorization: Bearer`.

- [ ] Keep legacy API available during the cutover window.
- [ ] Verify every existing user journey against NestJS.
- [ ] Run E2E suite before disabling Express routes.
- [ ] Commit backend-side compatibility changes separately from frontend changes.

---

## Task 18: Normalize Recipe Duration Schema

**Files:**
- Create a Prisma migration under `apps/api/prisma/migrations/...`
- Modify: `apps/api/prisma/schema.prisma`
- Modify: `recipes.repository.ts`

**Precondition:** Frontend is already using NestJS successfully.

**Migration target:**

```text
prep_time_minutes INTEGER NOT NULL
cook_time_minutes INTEGER NOT NULL
```

- [ ] Add new minute columns.
- [ ] Backfill from legacy intervals.
- [ ] Verify every row.
- [ ] Add `NOT NULL`.
- [ ] Switch Prisma repository reads/writes to native integer fields.
- [ ] Remove raw interval bridge.
- [ ] Remove legacy interval columns only in a separate reviewed migration after rollback risk is accepted.
- [ ] Commit.

```bash
git commit -m "refactor(db): normalize recipe duration fields"
```

---

## Task 19: Remove Legacy Express Backend

**Files:**
- Delete:
  - `src/server/app.js`
  - `src/server/routes.js`
  - `src/server/queries.js`
  - `src/server/utils.js`
  - `src/server/middleware/**`
  - legacy backend-only package metadata
- Modify root dependencies

**Preconditions:**

```text
✓ Nest unit tests pass
✓ Nest E2E tests pass
✓ Frontend regression passes
✓ Kong smoke tests pass
✓ Swagger complete
✓ Prisma migrations clean
✓ Production-like Docker stack works
```

- [ ] Remove Express implementation.
- [ ] Remove unused Express/MySQL/MongoDB packages.
- [ ] Verify clean install and build from repository root.
- [ ] Commit.

```bash
git commit -m "refactor: remove legacy Express backend"
```

---

## Task 20: Add CI/CD Quality Gates

**Files:**
- Create/modify CI workflow appropriate for repository hosting.

**Pipeline:**

```text
install
  ↓
lint
  ↓
typecheck
  ↓
unit tests
  ↓
build
  ↓
prisma generate
  ↓
integration/e2e
  ↓
docker build
  ↓
prisma migrate deploy
  ↓
deploy
```

- [ ] Ensure migrations run once per release, not per API replica.
- [ ] Prevent deploy if migration or E2E steps fail.
- [ ] Keep secrets in CI secret storage only.
- [ ] Commit.

```bash
git commit -m "ci: add backend quality and migration gates"
```

---

## Final Definition of Done

- [ ] React communicates with Kong in production.
- [ ] Kong forwards API traffic to NestJS.
- [ ] All public backend routes use `/api/v1`.
- [ ] Express backend removed.
- [ ] Prisma manages PostgreSQL schema evolution.
- [ ] No legacy unsupported `interval` mapping remains in application logic.
- [ ] Authenticated identity comes from JWT.
- [ ] Users cannot modify another user's profile, recipe, wishlist, or review.
- [ ] Recipe author cannot rate their own recipe.
- [ ] Categories and meal types are curated, not auto-created from arbitrary recipe text.
- [ ] Swagger documents all public APIs.
- [ ] Request IDs flow Kong -> Nest logs.
- [ ] Rate limiting works.
- [ ] Unit, integration, E2E, and production build all pass.
- [ ] `prisma migrate deploy` is part of release automation.
- [ ] No secrets are committed.
