# Current Frontend User Journeys

This document records the frontend journeys and the verification boundary for
the repository. Browser coverage is intentionally split between deterministic
mock-API tests and real-stack acceptance tests.

## Critical journeys

```text
Guest:
Home -> Search -> Recipe detail
Home -> Category -> Recipe detail
Recipes -> filter -> sort -> detail
Recipe -> Save -> login redirect

Authenticated:
Login -> return to original action
Save / unsave recipe
Rate / update review
Open Saved
Create recipe
Edit own recipe
Delete own recipe
Update profile
Change password
Logout
```

## Current behavior evidence

| Journey | Current behavior | Evidence | Task 1 coverage |
| --- | --- | --- | --- |
| Home -> Search -> Recipe detail | Home loads recipes through `RecipeProvider`; the Home search filters by recipe name and clicking a result navigates to `/recipe?id=<id>`. | `src/frontend/app/RecipeProvider.jsx`, `src/frontend/features/home/main/HomeSearchBar.jsx` | Playwright smoke test with deterministic API fixtures |
| Home -> Category -> Recipe detail | Home category selection filters the featured cards locally; a featured card click navigates to `/recipe?id=<id>`. | `src/frontend/features/home/HomeMain.jsx`, `src/frontend/features/home/main/CategorySection.jsx`, `src/frontend/features/home/main/FoodCardList.jsx` | Playwright smoke test |
| Recipes -> filter -> sort -> detail | `/food` reads category, meal, and search values from URL state; the result view applies local filters and provides Popular, Highest score, and Name A-Z sorting. | `src/frontend/features/food/Food.jsx`, `src/frontend/features/food/FoodContent.jsx` | Playwright smoke test |
| Recipe -> Save -> login redirect | A guest favorite click navigates to `/account`; protected `/wishlist` redirects to `/account?signup=false` with the attempted location in router state. | `src/frontend/features/home/HomeMain.jsx`, `src/frontend/features/recipes/Recipe.jsx`, `src/frontend/features/auth/components/ProtectedRoute.jsx`, `src/frontend/features/auth/components/AccountForm.jsx` | Playwright smoke test for the recipe Save action; real-stack auth/save coverage is in `e2e/real-stack/acceptance.spec.js` |
| Login -> return to original action | The login form can receive `location.state.from`, but the current login flow does not yet complete a pending save intent. | `src/frontend/features/auth/components/AccountForm.jsx`, `src/frontend/features/auth/components/LoginForm.jsx` | Not covered as a passing authenticated journey; product behavior is recorded as a gap |
| Save / unsave recipe | Authenticated recipe and Home handlers call the wishlist POST/DELETE endpoints and show a toast. | `src/frontend/features/recipes/Recipe.jsx`, `src/frontend/features/home/HomeMain.jsx` | Real-stack login, save, reload persistence, unsave, and cleanup |
| Rate / update review | Recipe detail submits a rating/review and uses the existing-rating state to choose create vs update; review deletion is not present in the current detail flow. | `src/frontend/features/recipes/Recipe.jsx`, `src/frontend/features/recipes/content/RecipeRating.jsx` | Not run without a stable authenticated fixture |
| Open Saved | `/wishlist` is protected and loads the authenticated user wishlist. | `src/frontend/app/AppRoutes.jsx`, `src/frontend/features/wishlist/Wishlist.jsx` | Guest redirect covered by mock E2E; API protection is covered by real-stack security tests |
| Create recipe | `/food/add` is protected; the current editor posts a new recipe and returns to `/food` on success. | `src/frontend/app/AppRoutes.jsx`, `src/frontend/features/recipes/AddRecipe.jsx` | Not run without a stable authenticated fixture |
| Edit own recipe | No edit route or edit action is currently exposed in the frontend profile flow. | `src/frontend/features/profile/PersonalRecipes.jsx`, `src/frontend/features/profile/Profile.jsx` | Recorded gap |
| Delete own recipe | Personal recipes expose a delete action backed by `DELETE /recipes/:id` and a confirmation modal. | `src/frontend/features/profile/PersonalRecipes.jsx` | Not run without a stable authenticated fixture |
| Update profile | Profile details submit updates through the user profile endpoint. | `src/frontend/features/profile/Profile.jsx`, `src/frontend/features/profile/PersonalInfo.jsx` | Not run without a stable authenticated fixture |
| Change password | Profile exposes a change-password page with client-side validation and a password endpoint. | `src/frontend/features/profile/Profile.jsx`, `src/frontend/features/profile/ChangePassword.jsx` | Not run without a stable authenticated fixture |
| Logout | Header and profile actions dispatch the auth logout action and navigate as appropriate. | `src/frontend/shared/layout/HeaderAuthButton.jsx`, `src/frontend/features/profile/Profile.jsx` | Not run without a stable authenticated fixture |

## Browser verification convention

- Tests live in `src/frontend/e2e/` and use Playwright Test.
- `pnpm test:e2e:quality` uses `src/frontend/e2e/playwright.config.js` and
  deterministic read-API fixtures for the CI frontend-quality gate. It covers
  loading/error/retry behavior, responsive overflow and hit targets, keyboard
  interaction, and serious/critical axe violations.
- `pnpm test:e2e:ci` remains the broader deterministic mock journey command for
  React routes, providers, navigation, filtering, sorting, and protected flows.
- `pnpm test:e2e:real` uses
  `src/frontend/e2e/real-stack.playwright.config.js` and
  `tools/run-real-stack-e2e.mjs`. It runs public discovery, authenticated save
  persistence, the kitchen loop, local inventory behavior, API security
  headers/session rotation, ownership/role enforcement, input validation, and
  oversized-request handling against the running NestJS API and PostgreSQL.
- Real-stack tests use the seeded demo accounts and clean up records created by
  the suite. They do not reset the whole development database.

## Known verification boundaries

- `src/frontend/package.json` defines `pnpm test` as `vitest` for the frontend package.
- The real-stack suite requires a reachable API at `FOOD_RECIPES_E2E_API_ORIGIN`
  (default `http://localhost:3000`) and seeded data; CI creates these explicitly.
- The current product scope does not include offline/PWA behavior, so no offline
  acceptance claim is made here.
- The existing `src/App.test.js` imports `./App`, which is not present in the
  current Vite source layout; it remains outside this testing slice.
