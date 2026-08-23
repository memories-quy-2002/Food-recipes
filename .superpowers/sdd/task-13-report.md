# Task 13 Report: Ratings and Reviews

## Files

- `src/backend/apps/api/src/app.module.ts`
- `src/backend/apps/api/package.json`
- `pnpm-lock.yaml`
- `src/backend/apps/api/src/infrastructure/prisma/prisma.service.ts`
- `src/backend/apps/api/src/infrastructure/prisma/prisma.service.spec.ts`
- `src/backend/apps/api/src/modules/auth/auth.service.ts`
- `src/backend/apps/api/src/modules/health/health.service.ts`
- `src/backend/apps/api/src/modules/users/users.service.ts`
- `src/backend/apps/api/src/modules/ratings/dto/upsert-rating.dto.ts`
- `src/backend/apps/api/src/modules/ratings/ratings.controller.ts`
- `src/backend/apps/api/src/modules/ratings/ratings.module.ts`
- `src/backend/apps/api/src/modules/ratings/ratings.repository.ts`
- `src/backend/apps/api/src/modules/ratings/ratings.service.ts`
- `src/backend/apps/api/src/modules/ratings/user-ratings.controller.ts`
- focused ratings service/repository tests
- `src/backend/apps/api/test/ratings.e2e-spec.ts`

## Commit

`d5e0f05 fix(api): make ratings Prisma 7 compatible` (based on `5a126bb feat(api): implement trusted rating and review rules`).

## Fixes

- Prisma 7 now constructs `PrismaClient` with `PrismaPg` and `DATABASE_URL`; `@prisma/adapter-pg` and `pg` are declared for the API package.
- Ratings wiring now imports the real `AppModule` in its HTTP test, overrides only `PrismaService`, and exercises the actual JWT guard/strategy without PostgreSQL.
- Explicit Nest injection tokens were added only for the interface-typed `UsersService`, `AuthService`, and `HealthService` dependencies required by the real module graph.
- Repository tests now assert SQL fragments and bound user, recipe, score, and review values.

## Verification

- Focused Prisma/ratings tests: 13/13 passed.
- Ratings AppModule wiring tests: 4/4 passed.
- Full API unit suite: 35/35 passed.
- Full API e2e suite: 5/5 passed.
- API TypeScript build: passed.
- Prisma validate with a test `DATABASE_URL`: passed.
- Compiled `PrismaService` construction and disconnect without connecting to PostgreSQL: passed.
- `git diff --check`: passed.

## Assumptions

- `rating`'s existing unique constraint `(user_id, recipe_id)` is the database-level one-rating invariant.
- Existing Nest recipe queries and the ratings repository use SQL aggregation for `overall_score` and `num_ratings`.
- Public review reads remain unauthenticated; mutation and current-user reads require the JWT guard.

## Known limitations

- No live PostgreSQL integration test was run; the AppModule test overrides `PrismaService` and repository tests mock Prisma SQL calls. Database connectivity, migrations, and live aggregate results remain unverified here.
- The legacy Express backend remains unchanged and is still available as the migration fallback.

## Final review follow-up

- Added `src/backend/apps/api` to the pnpm workspace and committed its API/Prisma adapter lockfile importer and package/snapshot entries, including `@prisma/adapter-pg`, `@prisma/client`, and `prisma`.
- `review: null` is rejected explicitly by DTO validation and the service boundary with HTTP 400 instead of reaching `null.length`.
- Added real-module HTTP coverage for JWT-protected self-review rejection (403), bounded review rejection (400), null review rejection (400), and a second update/upsert call through the controller, service, repository, and mocked Prisma SQL boundary.
- Focused ratings tests: 13/13 service/repository tests and 7/7 ratings HTTP tests passed.
- Full API unit suite: 36/36 passed.
- Full API e2e suite: 8/8 passed.
- API build: passed.
- Frozen lockfile validation with pnpm 11.18.0: passed.
- `git diff --check`: passed.

The focused and module tests remain mocked at the Prisma boundary; no live PostgreSQL integration or frontend changes were included.
