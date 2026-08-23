# Task 14 Report: Swagger / OpenAPI

## Status

Implemented and committed the NestJS Swagger/OpenAPI document for the public API.

## Changed scope

- Extracted Swagger document construction and `/docs` plus `/docs-json` setup into `src/backend/apps/api/src/bootstrap/swagger.bootstrap.ts`.
- Preserved the existing `api` global prefix, URI versioning (`/api/v1`), CORS, validation pipe, filters, interceptor, and request-context middleware.
- Added explicit API tags, operation summaries, parameters, success/error response metadata, and response schemas for health, auth, users, recipes, wishlist, ratings, and reviews.
- Annotated all request DTO fields, including rating, user, password, legacy token, and existing recipe DTOs.
- Added the missing `RecipesModule` import to the real `AppModule` so implemented recipe routes are included in the document.
- Added the repository injection token needed for the real recipe module graph to compile and boot.
- Added a focused real-AppModule Swagger document test that overrides only `PrismaService`; it does not override `JwtAuthGuard`.

## Verification

Focused Swagger document test:

```text
corepack pnpm --dir src/backend/apps/api exec jest --runInBand src/bootstrap/swagger.bootstrap.spec.ts
Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
```

Full API unit suite:

```text
corepack pnpm --dir src/backend/apps/api exec jest --runInBand
Test Suites: 12 passed, 12 total
Tests:       38 passed, 38 total
```

API build and typecheck:

```text
corepack pnpm --dir src/backend/apps/api run build
tsc -p tsconfig.build.json
Process exited with code 0.

corepack pnpm --dir src/backend/apps/api exec tsc -p tsconfig.json --noEmit
Process exited with code 0.
```

The focused document test verifies 23 versioned `/api/v1` operations, document title/description/version, bearer JWT security metadata, protected versus public operation security, tags/operation summaries/responses on every operation, and representative request DTO schemas.

`git diff --check` and the staged diff check passed with no whitespace errors.

## Limitations

- The document test mocks Prisma and does not verify live PostgreSQL connectivity or live database response payloads.
- The API has no global success-envelope interceptor; response schemas therefore describe the existing raw controller response shapes, while error schemas follow the existing global exception filter shape.
- The legacy Express backend and frontend were not changed.

## Commit

```text
feat(api): add Swagger OpenAPI documentation
```
