# Current frontend user journeys

Last reviewed: 2026-09-22

This document describes observable behavior in the current React application.
The primary audience is developers reviewing the recipe discovery and kitchen
loops. A journey is production-ready only when its loading, empty, error,
keyboard, mobile, desktop, and authenticated states are covered at the relevant
test boundary.

## Critical journeys

```text
Guest:
Home -> search -> recipe detail
Home -> category -> recipe detail
Recipes -> filter -> sort -> detail
Recipe -> save -> account -> original route and action

Authenticated:
Login/signup -> pending action -> original route
Save / unsave recipe and organize collections
Rate, update, delete, or report a review
Open Saved, create/edit/archive/restore/delete an own recipe
Update profile, preferences, notification settings, and password
Recipe -> plan -> shopping list -> pantry -> cooking -> history/journal
Recipe URL import -> preview -> private draft -> publish when complete
Logout -> refresh failure -> signed-out state
```

## Current behavior evidence

| Journey | Current behavior | Evidence | Verification |
| --- | --- | --- | --- |
| Home -> search -> recipe detail | Home search debounces input, queries the bounded public recipe endpoint, supports keyboard navigation, and links to recipe detail. | `src/frontend/features/home/main/HomeSearchBar.tsx`, `src/frontend/features/home/main/api/useHomeSearchQuery.ts` | Vitest + Playwright mocked journey |
| Home -> category -> recipe detail | Category cards update the featured view and recipe cards expose real links. | `src/frontend/features/home/main/CategorySection.tsx`, `FoodCardList.tsx` | Playwright mocked journey |
| Recipes -> filter -> sort -> detail | `/food` stores query, taxonomy filters, sort, page, and limit in the URL and sends them to the server. | `src/frontend/features/food/Food.tsx`, `api/useRecipesQuery.ts` | Vitest + responsive Playwright journey |
| Recipe -> save -> account -> action | Guests receive a safe internal return path and a typed pending intent; login/signup consumes it after the wishlist is loaded. | `src/frontend/features/auth/returnIntent.ts`, `features/auth/hooks/useLoginForm.ts`, `features/home/HomeMain.tsx`, `features/recipes/Recipe.tsx` | Unit + mocked journey + real-stack acceptance when available |
| Save / unsave / collections | Authenticated users can save, remove, create/rename/delete collections, and add/remove recipes from collections. | `features/wishlist/Wishlist.tsx`, `features/saved/**`, wishlist API queries | Backend Jest + mocked/real-stack journeys |
| Ratings and reviews | Authors cannot review their own recipe; other users can create/update/delete their own rating/review and report another review where the API permits it. | `features/recipes/Recipe.tsx`, `features/recipes/content/RecipeRating.tsx` | Focused component tests + backend authorization tests |
| Own recipe lifecycle | `/food/add` creates a recipe; `/food/edit` loads the owner record and saves changes; profile actions expose lifecycle operations. | `features/recipes/AddRecipe.tsx`, `EditRecipe.tsx`, `features/profile/PersonalRecipes.tsx` | Owner/guest/forbidden Playwright journeys |
| Password and profile settings | Profile and password updates use protected API routes and show inline validation/status states. | `features/profile/Profile.tsx`, `ChangePassword.tsx` | Backend authorization tests + authenticated journey |
| Recovery and verification | Guests can request generic recovery instructions, complete a valid reset or see a safe invalid-link state, consume email verification links, and authenticated unverified users can resend from a dismissible reminder. Tokens are never rendered. | src/frontend/features/auth/**, src/backend/src/modules/auth/** | Focused frontend API/component tests + 6 mocked Playwright journeys; backend recovery/config tests |
| Recipe -> plan -> shopping -> pantry -> cooking -> history/journal | A planned recipe can be imported once into the active shopping list, recovered after a failed purchase toggle, moved into pantry, cooked through a server-reported shortage, completed, and journaled. History shows an authenticated lifetime recap; recipe detail shows that user's cook count, latest servings, and private journal reflection. | `features/recipes/**`, `features/planning/**`, `features/shopping/**`, `features/pantry/**`, `features/history/**`, `features/journal/**`; `src/backend/src/modules/cooking-history/cooking-insights.*` | Existing kitchen-loop journey; recap and memory journeys are not yet automated |
| Planning -> cooking | Plans, recurring rules, templates, leftover items, cooking sessions, shortage handling, and return-to-plan context are persisted server-side. | `features/planning/**`, `features/history/**`, `features/recipes/cooking/**` | Backend tests + planning/kitchen Playwright journeys |
| Shopping -> pantry | Manual and recipe/planned imports can be checked, edited, cleared, or imported into pantry when quantity/unit data is sufficient; active duplicate imports are idempotent. | `features/shopping/**`, `features/pantry/**`, `src/backend/src/modules/planning/**` | Backend repository/service tests + shopping/pantry Playwright journeys |
| Recipe import -> draft | A public URL is previewed server-side, shown for editing, and saved as an owner draft without publishing incomplete data. | `features/recipe-import/**`, `src/backend/src/modules/recipe-imports/**` | Backend validation + retention journey |
| Logout and refresh recovery | Access tokens remain in memory, refresh uses the HttpOnly cookie, and failed refresh clears the authenticated state. | `features/auth/api/authSessionApi.ts`, `shared/api/axios.ts`, `app/AuthProvider.tsx` | Unit tests + real-stack security journey |

## SEO and indexability boundary

- Public Home, `/food`, and published recipe detail are indexable surfaces.
- Account, profile, planning, shopping, pantry, import, history,
  journal, edit, health, and error surfaces use `noindex,nofollow`.
- Recipe detail keeps the compatibility URL `/recipe?id=<id>` while canonical
  and structured-data output are generated from validated public recipe fields.
- User-generated reviews are rendered as content, but rating aggregates must
  never be fabricated when there are no ratings.

## Browser verification convention

- Tests live in `src/frontend/e2e/` and use Playwright Test.
- `pnpm test:e2e:quality` covers retryable discovery failure, the complete
  kitchen loop, responsive overflow/hit targets, keyboard behavior, and
  serious/critical axe violations.
- `pnpm test:e2e:ci` runs the broader deterministic mock journey set.
- `pnpm test:e2e:real` uses the Docker-backed API and PostgreSQL with seeded
  demo users; it cleans up created records and does not reset the database.
- CI installs Chromium explicitly. A local suite cannot be called passed when
  the Playwright browser executable is absent.

## Known verification boundaries

- Real-stack tests require a reachable API, PostgreSQL, and seeded data.
- Static/type/unit checks do not prove browser routing, CORS, cookie behavior,
  or live database parity.
- Personal kitchen data is scoped to the authenticated user. Existing group-scoped database rows remain legacy data and are not part of the personal journeys.
- The default serving count for new preferences is one; saved per-user preferences remain unchanged by the default.
- The product does not currently promise offline/PWA behavior.
