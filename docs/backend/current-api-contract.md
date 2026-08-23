# Current API contract

This document records the current NestJS API contract after the Express
migration.

## Base URL

The NestJS API is served under `/api/v1`. Local development uses the API on
`http://localhost:3000` or the Kong gateway on `http://localhost:8000`.

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
| GET | `/api/v1/auth/me` | JWT |
| PUT | `/api/v1/users/me/profile` | JWT |
| PUT | `/api/v1/users/me/password` | JWT |
| GET | `/api/v1/health/ready` | Public |

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
2. Keep response fields stable for the current client.
3. Treat JWT identity as server-owned for all protected endpoints.
