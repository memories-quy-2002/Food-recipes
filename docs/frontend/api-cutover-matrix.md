# Frontend API cutover matrix

Last reviewed: 2026-09-14

The frontend targets the direct NestJS API. Set
`VITE_API_BASE_URL=<API origin>`; the client appends `/api/v1`. The frontend
must contain only public `VITE_*` configuration and never a database URL,
service-role key, JWT secret, or mail-provider secret.

## Consumer coverage

| Product area | Frontend boundary | Current Nest route family | Status |
| --- | --- | --- | --- |
| Public Home and search | `features/home/**` | `/home-feed`, `/recipes`, `/categories`, `/meals` | Implemented; bounded search contract |
| Recipe discovery | `features/food/**` | `/recipes` with query, filter, sort, pagination | Implemented; server-side query state |
| Recipe detail and cooking | `features/recipes/**` | `/recipes/:id`, metadata, ratings, reviews, cooking session | Implemented; SEO enhancement in P0 A |
| Add/edit/lifecycle | `AddRecipe.tsx`, `EditRecipe.tsx` | `/recipes`, `/recipes/:id`, owner lifecycle routes | Implemented; owner authorization is server-side |
| Auth/session | `features/auth/**`, `AuthProvider` | `/auth/login`, `/auth/signup`, `/auth/refresh`, `/auth/logout`, `/auth/me` | Implemented; browser tokens remain in memory |
| Recovery/verification | P0 B screens | `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-email`, `/auth/resend-verification` | API implemented; UI delivery wave |
| Saved and collections | `features/wishlist/**`, `features/saved/**` | `/users/me/wishlist`, `/users/me/collections` | Implemented; authenticated |
| Profile and preferences | `features/profile/**`, `preferences/**` | `/users/me`, profile/password/preferences | Implemented; noindex |
| Planning and recurring meals | `features/planning/**` | `/users/me/meal-plans`, templates, recurring rules | Implemented; P0 E hardening |
| Shopping and pantry | `features/shopping/**`, `pantry/**` | personal and household list/pantry routes | Implemented; P0 E hardening |
| Households and leftovers | `features/households/**`, `leftovers/**` | membership, invites, scoped kitchen routes | Implemented; role-aware |
| History and journal | `features/history/**`, `journal/**` | cooking history, sessions, journal, photos | Implemented; private/noindex |
| Imports and media | `features/recipe-import/**` | recipe preview/draft and signed upload grants | Implemented; private/noindex |
| Notifications | `features/notifications/**` | notifications and preferences | Implemented; private/noindex |

“Implemented” means the checked-in controller, consumer, DTO mapping, and
focused tests exist. It does not mean a live database, CORS, cookie, storage,
or external delivery provider has been verified in this environment.

## Compatibility rules

- API requests use `Authorization: Bearer <access-token>` from the in-memory
  token store; the refresh coordinator uses the HttpOnly cookie.
- `/auth/token` and the body `refreshToken` field are compatibility bridges only.
- Recipe creation/editing maps frontend form values to the Nest DTO names and
  accepts Nest `201`, `200`, and `204` semantics at the relevant boundary.
- Ownership, household membership, role, validation, and published visibility
  are enforced by the API, not by client state.
- Query state is stored in the URL for discovery so reload and browser history
  preserve the user’s search context.

## Live acceptance gate

Before selecting a deployed API origin, run against a disposable/staging
database with representative seeded data:

1. Check readiness, CORS, security headers, JWT refresh rotation, logout, and refresh failure.
2. Run public Home search, filtering, detail, canonical/structured-data inspection, and mobile keyboard journeys.
3. Run signup/login/save/rating/review/profile/password and recovery/verification flows.
4. Run recipe create/edit/lifecycle and ownership/role denial cases.
5. Run recipe -> planning -> shopping -> pantry -> cooking -> history/journal,
   including household viewer behavior and shortage handling.
6. Record status codes, response shape, database read-back, and browser evidence.

The frontend package lives under `src/frontend`; the backend package lives
under `src/backend`. There is no root pnpm workspace or legacy `apps/api`
package.
