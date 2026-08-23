# Legacy API contract

This document captures the Express API contract before the NestJS migration. The
legacy server remains the fallback until the NestJS API reaches feature parity.

## Base URL

The legacy Express process listens on `http://localhost:4000`. Its routes are
registered without the `/api` prefix; the Express app strips `/api` when the
client sends that prefix.

## Routes

| Method | Legacy route | NestJS target | Auth target |
| --- | --- | --- | --- |
| GET | `/recipes` | `/api/v1/recipes` | Public |
| GET | `/recipes/:rid` | `/api/v1/recipes/:id` | Public |
| GET | `/users/:uid/recipes` | `/api/v1/users/me/recipes` | JWT |
| POST | `/recipes` | `/api/v1/recipes` | JWT |
| DELETE | `/recipes/:rid` | `/api/v1/recipes/:id` | JWT + owner |
| GET | `/categories` | `/api/v1/categories` | Public |
| GET | `/meals` | `/api/v1/meals` | Public |
| GET | `/users/:uid/wishlist` | `/api/v1/users/me/wishlist` | JWT |
| POST | `/users/:uid/wishlist` | `/api/v1/users/me/wishlist` | JWT |
| DELETE | `/users/:uid/wishlist/:rid` | `/api/v1/users/me/wishlist/:recipeId` | JWT |
| GET | `/users/:uid/ratings` | `/api/v1/users/me/ratings` | JWT |
| PUT | `/users/:uid/ratings/:rid` | `/api/v1/recipes/:recipeId/rating` | JWT |
| GET | `/recipes/:rid/reviews` | `/api/v1/recipes/:recipeId/reviews` | Public |
| POST | `/auth/login` | `/api/v1/auth/login` | Public |
| POST | `/auth/signup` | `/api/v1/auth/signup` | Public |
| POST | `/auth/token` | `/api/v1/auth/token` | Legacy compatibility |
| PUT | `/users/:uid/profile` | `/api/v1/users/me/profile` | JWT |
| PUT | `/users/:uid/password` | `/api/v1/users/me/password` | JWT |
| GET | `/health/database` | `/api/v1/health/ready` | Public |

## Authentication response

The legacy login and signup responses contain the following important fields:

```ts
interface AuthResponse {
  user: User;
  token: string;
  message: string;
}
```

The frontend currently stores the token as `jwt` in local storage or session
storage. The NestJS client integration will attach it as a Bearer token and will
derive the authenticated user from the JWT rather than accepting a client-owned
`:uid` parameter.

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

`recipes.prep_time` and `recipes.cook_time` are PostgreSQL `interval` columns.
They remain unchanged during the parallel migration. NestJS reads and writes
their minute representation through parameterized raw SQL until the later
normalization phase.

## Compatibility rules

1. Do not reset or destructively migrate the existing database.
2. Keep Express available until frontend cutover and NestJS regression tests pass.
3. Keep the legacy response fields required by the current client during the
   compatibility window.
4. Treat JWT identity as server-owned for new protected endpoints.
