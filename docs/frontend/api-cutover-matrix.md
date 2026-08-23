# Frontend API cutover matrix

Task 17 adds a switchable client target without declaring production parity. The
default remains the legacy Express API. Set `VITE_API_TARGET=nest` (or `kong`)
and `VITE_KONG_BASE_URL=<Kong origin>` to use `<Kong origin>/api/v1`; do not put
secrets or environment-specific production URLs in source control. In local
development, Nest mode defaults the Kong origin to `http://localhost:8000` when
`VITE_KONG_BASE_URL` is omitted.

## Route and journey status

| Current journey / client capability | Nest route status | Current cutover status |
| --- | --- | --- |
| Recipe list, detail, delete, and own-recipe list | Implemented: `/recipes`, `/recipes/:id`, `/users/me/recipes`; delete accepts Nest `204` | Contract-ready at the checked-in consumer boundary; requires live E2E and response/UX parity evidence |
| Create recipe | Implemented: `POST /recipes`; consumer maps the form to `CreateRecipeDto` and accepts Nest `201` | Route/payload contract-ready, but the browser journey is not Nest-ready because the form's category/meal loaders are explicit legacy-only and Nest has no taxonomy controllers |
| Recipe reviews and authenticated rating | Implemented: `/recipes/:recipeId/reviews`, `/recipes/:recipeId/rating`, `/users/me/ratings` | Contract-ready; requires live authenticated E2E |
| Login and signup | Implemented: `/auth/login`, `/auth/signup` | Contract-ready; signup status 201 is accepted; requires live E2E |
| Save / unsave and open Saved | Implemented: `/users/me/wishlist`; consumer sends `recipeId`, accepts Nest `201`, and reads nested saved recipes | Contract-ready at the checked-in consumer boundary; requires live authenticated E2E |
| Profile and change password | Implemented: `/users/me/profile`, `/users/me/password`; profile consumer sends direct DTO fields and reads the direct user response | Contract-ready at the checked-in consumer boundary; requires live authenticated E2E |
| Home category/meal filters, Food filter loaders, and Add Recipe taxonomy loaders | No Nest categories/meals controllers | Legacy-only; the client raises an explicit compatibility error in Nest mode |
| Express root/database diagnostics | Legacy `/` and `/health/database`; Nest `/health/live` and `/health/ready` | Mapped per target; live health still required |

“Contract-ready at the checked-in consumer boundary” means the route exists in
the checked-in Nest controllers, the client sends the DTO field names/types,
and the client handles the documented status/response shape. It does not mean
Kong, PostgreSQL, JWT signing, payload data availability, or the browser
journey has passed in a live environment. The create-recipe row is deliberately
not marked as a Nest-ready browser journey because its required taxonomy data
is still legacy-only.

## Live E2E gate

Before selecting Nest mode for a deployed frontend, run the browser suite and
authenticated journey checks against Kong with a real Nest API and PostgreSQL:

1. Verify Kong forwards `/api/v1/*`, CORS, JWT issuer/signature, and readiness.
2. Verify login/signup, recipe discovery/detail, save/unsave, ratings/reviews,
   profile/password, create/delete, and logout in a browser.
3. Compare response payloads and status codes used by the current consumers.
4. Keep Express available until those checks pass; only then can the legacy
   route removal in Task 19 be reviewed.

The requested target-layout migration from `src/client` to `src/frontend` is a
separate frontend follow-up. This task keeps `src/client` and `src/server`.
