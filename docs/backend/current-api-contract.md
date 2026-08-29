# Current API contract

This document records the current NestJS API contract after the Express
migration.

## Base URL

The NestJS API is served under `/api/v1`. Local development and the
production-like Compose stack use the API directly at
`http://localhost:3000` by default.

## Routes

| Method | Route | Auth target |
| --- | --- | --- | --- |
| GET | `/api/v1/recipes` | Public |
| GET | `/api/v1/recipes/:id` | Public |
| GET | `/api/v1/users/me/recipes` | JWT |
| POST | `/api/v1/recipes` | JWT |
| DELETE | `/api/v1/recipes/:id` | JWT + owner |
| GET | `/api/v1/categories` | Public |
| GET | `/api/v1/meals` | Public |
| GET | `/api/v1/users/me/wishlist` | JWT |
| POST | `/api/v1/users/me/wishlist` | JWT |
| DELETE | `/api/v1/users/me/wishlist/:recipeId` | JWT |
| GET | `/api/v1/users/me/ratings` | JWT |
| PUT | `/api/v1/recipes/:recipeId/rating` | JWT |
| DELETE | `/api/v1/recipes/:recipeId/rating` | JWT |
| GET | `/api/v1/recipes/:recipeId/reviews` | Public |
| POST | `/api/v1/auth/login` | Public |
| POST | `/api/v1/auth/signup` | Public |
| POST | `/api/v1/auth/token` | Compatibility bridge |
| POST | `/api/v1/auth/refresh` | Refresh cookie / backend fallback |
| POST | `/api/v1/auth/logout` | Refresh-session revocation |
| POST | `/api/v1/auth/forgot-password` | Public, generic response |
| POST | `/api/v1/auth/reset-password` | Single-use token |
| POST | `/api/v1/auth/verify-email` | Single-use token |
| POST | `/api/v1/auth/resend-verification` | JWT |
| GET | `/api/v1/auth/me` | JWT |
| PUT | `/api/v1/users/me/profile` | JWT |
| PUT | `/api/v1/users/me/password` | JWT |
| GET | `/api/v1/health/ready` | Public |
| GET | `/api/v1/users/me/collections` | JWT |
| POST | `/api/v1/users/me/collections` | JWT |
| PATCH | `/api/v1/users/me/collections/:collectionId` | JWT + owner |
| DELETE | `/api/v1/users/me/collections/:collectionId` | JWT + owner |
| POST | `/api/v1/users/me/collections/:collectionId/recipes` | JWT + owner |
| DELETE | `/api/v1/users/me/collections/:collectionId/recipes/:recipeId` | JWT + owner |
| POST | `/api/v1/recipes/:recipeId/reviews/:ratingId/report` | JWT |
| GET | `/api/v1/admin/review-reports` | JWT + admin role |
| PATCH | `/api/v1/admin/review-reports/:reportId` | JWT + admin role |
| GET | `/api/v1/users/me/meal-plans` | JWT |
| POST | `/api/v1/users/me/meal-plans` | JWT |
| GET | `/api/v1/users/me/meal-plans/:planId` | JWT + owner |
| PATCH | `/api/v1/users/me/meal-plans/:planId` | JWT + owner |
| DELETE | `/api/v1/users/me/meal-plans/:planId` | JWT + owner |
| POST | `/api/v1/users/me/meal-plans/:planId/items` | JWT + owner |
| PATCH | `/api/v1/users/me/meal-plans/:planId/items/:itemId` | JWT + owner |
| DELETE | `/api/v1/users/me/meal-plans/:planId/items/:itemId` | JWT + owner |
| GET | `/api/v1/users/me/shopping-list` | JWT |
| POST | `/api/v1/users/me/shopping-list/items` | JWT |
| PATCH | `/api/v1/users/me/shopping-list/items/:itemId` | JWT + owner |
| DELETE | `/api/v1/users/me/shopping-list/items/:itemId` | JWT + owner |
| POST | `/api/v1/users/me/shopping-list/from-recipe` | JWT |
| DELETE | `/api/v1/users/me/shopping-list/completed` | JWT |
| GET | `/api/v1/users/me/cooking-session` | JWT |
| POST | `/api/v1/users/me/cooking-session` | JWT |
| PATCH | `/api/v1/users/me/cooking-session/:sessionId` | JWT + owner |
| POST | `/api/v1/users/me/cooking-session/:sessionId/complete` | JWT + owner |
| DELETE | `/api/v1/users/me/cooking-session/:sessionId` | JWT + owner |
| POST | `/api/v1/media/recipe-image/upload-url` | JWT |

## Authentication response

The legacy login and signup responses contain the following important fields:

```ts
interface AuthResponse {
  user: User;
  token: string;
  message: string;
}
```

Access JWTs are short-lived (15 minutes by default). Login and signup set an
HttpOnly, SameSite refresh cookie. Refresh tokens are opaque, stored only as
SHA-256 hashes, rotated on use, and revoked on reuse or logout. The optional
body `refreshToken` on `/auth/refresh` is a backend-client compatibility
fallback; browser clients should use the cookie. Frontend token-storage
migration is intentionally deferred to the later frontend slice.

The `/auth/token` endpoint remains a compatibility bridge and should not be
used by new clients. Recovery endpoints return generic responses for unknown
emails and never return a reset or verification token. A mail delivery
provider must be configured before those stored single-use tokens can be
delivered to users.

## Legacy data names

The PostgreSQL database currently uses these table and column names:

- `accounts.user_id`, `full_name`, `password`, `email`, `phone`, `address`
- `recipes.recipe_id`, `recipe_name`, `recipe_description`, `meal_id`,
  `category_id`, `prep_time`, `cook_time`, `date_added`, `user_id`,
  `ingredients`, `instructions`
- `categories.category_id`, `category_name`
- `meals.meal_id`, `meal_name`, `meal_description`
- `wishlist.wishlist_id`, `user_id`, `recipe_id`, `date_added`
- `rating.rating_id`, `user_id`, `recipe_id`, `score`, `review`, `date_added`
- `saved_collections`, `saved_collection_items`, and `review_reports` are
  additive P1 tables.
- `meal_plans`, `meal_plan_items`, and `shopping_list_items` are additive P2
  tables. Recipe ingredients are copied as separate free-text lines; the API
  does not infer equivalent quantities.
- `cooking_sessions` stores one user-owned progress record per recipe while it
  is active or paused. Completion atomically creates the existing
  `cooking_history` record; browser storage is only a guest fallback.
- `accounts.role` is server-owned (`user` or `admin`). Admin moderation routes
  always reload the current role through `RolesGuard`.

`recipes.prep_time` and `recipes.cook_time` are PostgreSQL `interval` columns.
They remain unchanged during the parallel migration. NestJS reads and writes
their minute representation through parameterized raw SQL until the later
normalization phase.

## Compatibility rules

1. Do not reset or destructively migrate the existing database.
2. Keep response fields stable for the current client.
3. Treat JWT identity as server-owned for all protected endpoints.
4. Protected writes use the JWT subject and return ownership-safe 404 responses
   for foreign collections, plans, and list items.
5. Recipe image upload grants accept only JPEG, PNG, WebP, or AVIF metadata up
   to 5 MiB and last 10 minutes. Storage signing is intentionally abstracted
   behind `SUPABASE_UPLOAD_GRANT_BASE_URL` and
   `SUPABASE_UPLOAD_GRANT_SECRET`; the API refuses to issue a grant when
   signing configuration is absent.
6. JSON and URL-encoded request bodies are capped at 256 KiB, common security
   headers are applied at bootstrap, and auth attempts have an in-process
   per-IP/per-email throttle. A shared rate-limit service should be added
   before scaling the API horizontally.
7. Backend CI audits dependencies at high severity. One upstream Prisma
   tooling advisory (`GHSA-ggr8-5vv4-36mx`) is explicitly allowlisted because
   Prisma 7.9.1 still pins the vulnerable transitive version; this should be
   removed when the Prisma dependency publishes a patched pin.
