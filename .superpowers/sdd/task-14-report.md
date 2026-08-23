# Task 14 Report: Swagger / OpenAPI

## Status

Implemented and committed the NestJS Swagger/OpenAPI document for the public API, with the final Task 14 review findings corrected.

## Changed scope

- Extracted Swagger document construction and `/docs` plus `/docs-json` setup into `src/backend/apps/api/src/bootstrap/swagger.bootstrap.ts`.
- Preserved the existing `api` global prefix, URI versioning (`/api/v1`), CORS, validation pipe, filters, interceptor, and request-context middleware.
- Added explicit API tags, operation summaries, parameters, success/error response metadata, and response schemas for health, auth, users, recipes, wishlist, ratings, and reviews.
- Annotated all request DTO fields, including rating, user, password, legacy token, and existing recipe DTOs.
- Added the missing `RecipesModule` import to the real `AppModule` so implemented recipe routes are included in the document.
- Added the repository injection token needed for the real recipe module graph to compile and boot.
- Added a focused real-AppModule Swagger document test that overrides only `PrismaService`; it does not override `JwtAuthGuard`.
- Removed duplicate recipe-list query parameters by relying on the reflected `RecipeQueryDto` once.
- Aligned recipe, wishlist, rating, review, and user response schemas with repository payloads, including optional list arrays, nullable scalar types, and `meal_description`.
- Added missing `400` metadata for query/`ParseIntPipe` routes, missing `401` metadata for protected routes, and a distinct delete-rating response example.
- Added `403` and `404` metadata for rating mutation failures, `404` metadata for authenticated user profile routes including `GET /api/v1/auth/me`, and `409` metadata for duplicate-email signup.
- Added a dedicated wishlist-removal response schema whose message example matches the runtime response.
- Verified both `/docs` and `/docs-json` through the focused document test without a live database.

## Verification

Focused Swagger document test:

```text
corepack pnpm --dir src/backend/apps/api exec jest --runInBand src/bootstrap/swagger.bootstrap.spec.ts
Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
```

Full API unit suite:

```text
corepack pnpm --dir src/backend/apps/api exec jest --runInBand
Test Suites: 12 passed, 12 total
Tests:       41 passed, 41 total
```

API build and typecheck:

```text
corepack pnpm --dir src/backend/apps/api run build
tsc -p tsconfig.build.json
Process exited with code 0.

git diff --check
No whitespace errors.

corepack pnpm --dir src/backend/apps/api exec tsc -p tsconfig.json --noEmit
Process exited with code 0.
```

The focused document test verifies 23 versioned `/api/v1` operations, document title/description/version, both `/docs` and `/docs-json`, bearer JWT security metadata, protected versus public operation security, unique recipe query parameters, nullable scalar schemas, optional list/detail recipe fields, `meal_description`, the wishlist removal message, shared error response schemas for representative 403/404/409 failures including `GET /api/v1/auth/me`, tags/operation summaries/responses on every operation, and representative request DTO schemas.

`git diff --check` and the staged diff check passed with no whitespace errors.

## Limitations

- The document test mocks Prisma and does not verify live PostgreSQL connectivity or live database response payloads.
- The API has no global success-envelope interceptor; response schemas therefore describe the existing raw controller response shapes, while error schemas follow the existing global exception filter shape.
- The legacy Express backend and frontend were not changed.

## Commit

```text
fix(api): complete Task 14 Swagger review fixes
```
