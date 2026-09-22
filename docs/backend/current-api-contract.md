# Current API contract

Last reviewed: 2026-09-22

The current backend is a single NestJS package under `src/backend`. It exposes
URI-versioned REST routes under `/api/v1`. This document is a developer-facing
route map; DTO decorators, response DTOs, and controller code remain the
executable source of truth.

## Base URLs and operational endpoints

- Local API origin: `http://localhost:3000`
- API base: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/api/docs`
- Swagger JSON: `http://localhost:3000/api/docs-json`
- Liveness: `GET /api/v1/health/live`
- Readiness: `GET /api/v1/health/ready`

## Public discovery routes

| Method | Route | Contract |
| --- | --- | --- |
| GET | `/home-feed` | Bounded quick and popular public sections |
| GET | `/recipes` | Published recipe list with `q`/`search`, taxonomy filters, supported sort/filter, page, and limit |
| GET | `/recipes/:id` | Published recipe detail |
| GET | `/categories` | Public taxonomy |
| GET | `/meals` | Public taxonomy |
| POST | `/suggestions` | Submit a public suggestion |
| POST | `/users/me/suggestions` | Submit an authenticated suggestion |

Public recipe list limits are validated server-side. Search uses PostgreSQL
full-text and trigram indexes from migration
`20260826100000_add_recipe_search_indexes`; callers must not implement a second
full-catalog filter in the browser.

## Authentication routes

| Method | Route | Auth target |
| --- | --- | --- |
| POST | `/auth/signup` | Public; returns `201` and sets a refresh cookie |
| POST | `/auth/login` | Public; returns `200` and sets a refresh cookie |
| POST | `/auth/refresh` | Refresh cookie; body token is a compatibility fallback |
| POST | `/auth/logout` | Refresh cookie revocation |
| POST | `/auth/forgot-password` | Public; generic response for unknown email |
| POST | `/auth/reset-password` | Public single-use token |
| POST | `/auth/verify-email` | Public single-use token |
| POST | `/auth/resend-verification` | JWT |
| GET | `/auth/me` | JWT |
| POST | `/auth/token` | Compatibility bridge for legacy body-token clients |

Access JWTs are short-lived. Browser refresh uses the `food_refresh` HttpOnly,
SameSite cookie; refresh tokens are opaque, stored as SHA-256 hashes, rotated on
use, and revoked on reuse or logout. Browser access tokens are held in frontend
module memory. New clients must not use `/auth/token` or store access/refresh
tokens in persistent browser storage.

Recovery endpoints never return a reset or verification token. A configured
delivery adapter must send the stored token to the user; an unset local
delivery configuration is not evidence that a production email was delivered.
Local and test environments may intentionally omit the delivery values, but
production startup must fail fast when AUTH_MAIL_WEBHOOK_URL or
AUTH_PUBLIC_WEB_URL is missing.

## Authenticated recipe and community routes

| Method | Route | Auth target |
| --- | --- | --- |
| GET | `/users/me` | JWT |
| PUT | `/users/me/profile` | JWT |
| PUT | `/users/me/password` | JWT; current password required |
| GET | `/users/me/recipes` | JWT; owner-scoped status filter |
| POST | `/users/me/recipes/drafts` | JWT; creates an owner draft |
| POST | `/recipes` | JWT; creates a published recipe when valid |
| PATCH | `/recipes/:id` | JWT + owner; archived recipes are read-only |
| DELETE | `/recipes/:id` | JWT + owner; returns `204` |
| PUT | `/recipes/:id/ingredients` | JWT + owner |
| PUT | `/recipes/:id/nutrition` | JWT + owner |
| PUT | `/recipes/:id/dietary-tags` | JWT + owner |
| POST | `/recipes/:id/publish` | JWT + owner |
| POST | `/recipes/:id/archive` | JWT + owner |
| POST | `/recipes/:id/restore` | JWT + owner |
| GET/PUT | `/recipes/:recipeId/metadata` | GET public; PUT JWT + owner |
| PUT | `/recipes/:recipeId/rating` | JWT; authors cannot self-review |
| DELETE | `/recipes/:recipeId/rating` | JWT; own rating only |
| GET | `/recipes/:recipeId/reviews` | Public |
| POST | `/recipes/:recipeId/reviews/:ratingId/report` | JWT |
| GET | `/users/me/ratings` | JWT |
| GET/PATCH/DELETE | `/users/me/recipes/:recipeId/note` | JWT; private note |
| GET/POST/PATCH/DELETE | `/users/me/collections...` | JWT; collection owner |
| GET/PATCH | `/admin/review-reports...` | JWT + current admin role |

The collection route suffixes are `/:collectionId/recipes` and
`/:collectionId/recipes/:recipeId`. Ownership is evaluated on the server from
the JWT subject; client-provided user IDs are not trusted.

## Planning and personal kitchen routes

All kitchen data routes are personal and are scoped on the server to the
authenticated user represented by the JWT subject. There are no household
membership, invitation, or shared-kitchen routes in the current API.

| Method | Route | Auth target |
| --- | --- | --- |
| GET/POST | /users/me/meal-plans | JWT; personal owner |
| GET/PATCH/DELETE | /users/me/meal-plans/:planId | JWT; personal owner |
| POST | /users/me/meal-plans/:planId/items | JWT; personal owner |
| POST | /users/me/meal-plans/:planId/items/leftover | JWT; personal owner |
| PATCH/DELETE | /users/me/meal-plans/:planId/items/:itemId | JWT; personal owner |
| POST | /users/me/meal-plans/generate-preview | JWT |
| POST | /users/me/meal-plans/from-preview | JWT |
| GET/POST | /users/me/meal-plan-templates | JWT |
| POST | /users/me/meal-plan-templates/:templateId/apply | JWT |
| GET/POST | /users/me/recurring-meal-rules | JWT |
| DELETE | /users/me/recurring-meal-rules/:ruleId | JWT |
| GET | /users/me/shopping-list | JWT |
| POST | /users/me/shopping-list/items | JWT |
| PATCH/DELETE | /users/me/shopping-list/items/:itemId | JWT; personal owner |
| POST | /users/me/shopping-list/from-recipe | JWT |
| POST | /users/me/shopping-list/prepare | JWT |
| DELETE | /users/me/shopping-list/completed | JWT |

Unchecked shopping items are idempotent for matching active entries by label and
quantity; checked rows may be added again. An update that would create an active
duplicate returns HTTP 409 with code SHOPPING_ITEM_DUPLICATE.

## Pantry, leftovers, cooking, and journals

| Method | Route | Auth target |
| --- | --- | --- |
| GET/POST/PATCH/DELETE | /users/me/pantry... | JWT; personal owner |
| POST | /users/me/pantry/from-shopping-list | JWT; personal owner |
| GET/POST | /users/me/leftovers | JWT; personal owner |
| GET/POST | /users/me/cooking-history | JWT; personal owner |
| GET | /users/me/cooking-history/recap | JWT; lifetime totals and most-cooked recipe for the authenticated user |
| GET | /users/me/recipes/:recipeId/cooking-memory | JWT; cook count and latest serving/journal memory for the authenticated user |
| GET/POST/PATCH/DELETE | /users/me/cooking-session... | JWT + session owner |
| POST | /users/me/cooking-session/:sessionId/complete | JWT + session owner |
| GET/PUT | /users/me/cooking-history/:historyId/journal | JWT + history owner |

Cooking completion is transactional: it records history and ingredient usage,
and may return a shortage result or shopping-list handoff. Personal pantry and
leftover routes never include legacy records with a non-null household scope.
Browser storage is a guest fallback only and is not the source of truth for
authenticated progress.

## Preferences, recommendations, notifications, imports, and media

| Method | Route | Auth target |
| --- | --- | --- |
| GET/PUT | /users/me/food-preferences | JWT |
| GET | /users/me/home-feed | JWT; personalized kitchen sections |
| PUT/DELETE | /users/me/recommendations/not-interested/:recipeId | JWT |
| GET/PATCH/POST | /users/me/notifications... | JWT |
| GET/PUT | /users/me/notification-preferences | JWT |
| POST | /users/me/recipe-imports/preview | JWT |
| POST | /users/me/recipe-imports/drafts | JWT |
| POST | /media/recipe-image/upload-url | JWT; validated signed grant |
| POST | /media/journal-photo/upload-url | JWT; validated signed grant |

## Data and compatibility rules

1. Do not reset or destructively migrate an existing database.
2. Keep public reads limited to published recipes; owner reads may include draft and archived records.
3. Use the JWT subject for ownership and return ownership-safe errors.
4. Legacy `recipes.ingredients` and interval duration columns remain compatibility fields while structured ingredients and minute columns are canonical.
5. Recipe image grants accept only JPEG, PNG, WebP, or AVIF metadata up to 5 MiB and expire after 10 minutes.
6. JSON and URL-encoded request bodies are capped at 256 KiB; security headers and auth throttling are configured at bootstrap.
7. PostgreSQL migrations are additive and must be validated and rehearsed in local/staging environments before an operator applies them to production.
8. Existing household tables and nullable scope columns are retained as legacy data. Personal API reads must not expose household-scoped records; do not drop or reassign legacy data without an approved backup and migration plan.
9. The default serving count for newly created food preferences is one. Changing this default does not overwrite existing user preferences.

## Verification

From `src/backend`:

```powershell
corepack pnpm@11.18.0 prisma:validate
corepack pnpm@11.18.0 check
corepack pnpm@11.18.0 build
corepack pnpm@11.18.0 test:e2e
```

Static checks and unit tests do not prove live CORS, cookie, PostgreSQL, or
third-party delivery behavior. Record those separately when a real-stack
environment is available.
