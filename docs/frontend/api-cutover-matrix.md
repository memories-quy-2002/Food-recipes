# Frontend API cutover matrix

The frontend now targets the NestJS API directly. Set
`VITE_API_BASE_URL=<API origin>` to use `<API origin>/api/v1`; do not put
secrets or environment-specific production URLs in source control. In local
development, the client defaults the API origin to `http://localhost:3000`
when `VITE_API_BASE_URL` is omitted.

## Route and journey status

| Current journey / client capability | Nest route status | Current cutover status |
| --- | --- | --- |
| Recipe list, detail, delete, and own-recipe list | Implemented: `/recipes`, `/recipes/:id`, `/users/me/recipes`; delete accepts Nest `204` | Contract-ready at the checked-in consumer boundary; requires live E2E and response/UX parity evidence |
| Create recipe | Implemented: `POST /recipes`; consumer maps the form to `CreateRecipeDto` and accepts Nest `201` | Contract-ready at the checked-in consumer boundary; requires live authenticated E2E |
| Recipe reviews and authenticated rating | Implemented: `/recipes/:recipeId/reviews`, `/recipes/:recipeId/rating`, `/users/me/ratings` | Contract-ready; requires live authenticated E2E |
| Login and signup | Implemented: `/auth/login`, `/auth/signup` | Contract-ready; signup status 201 is accepted; requires live E2E |
| Save / unsave and open Saved | Implemented: `/users/me/wishlist`; consumer sends `recipeId`, accepts Nest `201`, and reads nested saved recipes | Contract-ready at the checked-in consumer boundary; requires live authenticated E2E |
| Profile and change password | Implemented: `/users/me/profile`, `/users/me/password`; profile consumer sends direct DTO fields and reads the direct user response | Contract-ready at the checked-in consumer boundary; requires live authenticated E2E |
| Home category/meal filters, Food filter loaders, and Add Recipe taxonomy loaders | Implemented: `/categories` and `/meals` | Contract-ready; requires live E2E |
| API/database diagnostics | Nest `/health/live` and `/health/ready` | Contract-ready; live health still required |

“Contract-ready at the checked-in consumer boundary” means the route exists in
the checked-in Nest controllers, the client sends the DTO field names/types,
and the client handles the documented status/response shape. It does not mean
PostgreSQL, JWT signing, payload data availability, or the browser
journey has passed in a live environment.

## Live E2E gate

Before selecting a deployed frontend API origin, run the browser suite and
authenticated journey checks against the direct Nest API and PostgreSQL:

1. Verify `/api/v1/*`, CORS, JWT issuer/signature, and readiness.
2. Verify login/signup, recipe discovery/detail, save/unsave, ratings/reviews,
   profile/password, create/delete, and logout in a browser.
3. Compare response payloads and status codes used by the current consumers.
4. Record the live evidence before treating the cutover as production-ready.

The frontend lives under `src/frontend`; the NestJS implementation lives under
`src/backend`.
