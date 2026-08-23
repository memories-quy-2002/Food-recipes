# Current Frontend User Journeys

This document records the frontend behavior observed in the repository before Task 1 changes. Task 1 adds regression coverage and does not alter product behavior.

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
| Home -> Search -> Recipe detail | Home loads recipes through `RecipeProvider`; the Home search filters by recipe name and clicking a result navigates to `/recipe?id=<id>`. | `src/client/app/RecipeProvider.jsx`, `src/client/features/home/main/HomeSearchBar.jsx` | Playwright smoke test with deterministic API fixtures |
| Home -> Category -> Recipe detail | Home category selection filters the featured cards locally; a featured card click navigates to `/recipe?id=<id>`. | `src/client/features/home/HomeMain.jsx`, `src/client/features/home/main/CategorySection.jsx`, `src/client/features/home/main/FoodCardList.jsx` | Playwright smoke test |
| Recipes -> filter -> sort -> detail | `/food` reads category, meal, and search values from URL state; the result view applies local filters and provides Popular, Highest score, and Name A-Z sorting. | `src/client/features/food/Food.jsx`, `src/client/features/food/FoodContent.jsx` | Playwright smoke test |
| Recipe -> Save -> login redirect | A guest favorite click navigates to `/account`; protected `/wishlist` redirects to `/account?signup=false` with the attempted location in router state. | `src/client/features/home/HomeMain.jsx`, `src/client/features/recipes/Recipe.jsx`, `src/client/features/auth/components/ProtectedRoute.jsx`, `src/client/features/auth/components/AccountForm.jsx` | Playwright smoke test for the recipe Save action; protected-route redirect is documented as a follow-up |
| Login -> return to original action | The login form can receive `location.state.from`, but the current login flow does not yet complete a pending save intent. | `src/client/features/auth/components/AccountForm.jsx`, `src/client/features/auth/components/LoginForm.jsx` | Not covered as a passing authenticated journey; product behavior is recorded as a gap |
| Save / unsave recipe | Authenticated recipe and Home handlers call the wishlist POST/DELETE endpoints and show a toast. | `src/client/features/recipes/Recipe.jsx`, `src/client/features/home/HomeMain.jsx` | Not run without a stable authenticated fixture |
| Rate / update review | Recipe detail submits a rating/review and uses the existing-rating state to choose create vs update; review deletion is not present in the current detail flow. | `src/client/features/recipes/Recipe.jsx`, `src/client/features/recipes/recipeContent/RecipeRating.jsx` | Not run without a stable authenticated fixture |
| Open Saved | `/wishlist` is protected and loads the authenticated user wishlist. | `src/client/app/AppRoutes.jsx`, `src/client/features/wishlist/Wishlist.jsx` | Guest redirect covered; authenticated page is not run |
| Create recipe | `/food/add` is protected; the current editor posts a new recipe and returns to `/food` on success. | `src/client/app/AppRoutes.jsx`, `src/client/features/recipes/AddRecipe.jsx` | Not run without a stable authenticated fixture |
| Edit own recipe | No edit route or edit action is currently exposed in the frontend profile flow. | `src/client/features/profile/PersonalRecipes.jsx`, `src/client/features/profile/Profile.jsx` | Recorded gap |
| Delete own recipe | Personal recipes expose a delete action backed by `DELETE /recipes/:id` and a confirmation modal. | `src/client/features/profile/PersonalRecipes.jsx` | Not run without a stable authenticated fixture |
| Update profile | Profile details submit updates through the user profile endpoint. | `src/client/features/profile/Profile.jsx`, `src/client/features/profile/PersonalInfo.jsx` | Not run without a stable authenticated fixture |
| Change password | Profile exposes a change-password page with client-side validation and a password endpoint. | `src/client/features/profile/Profile.jsx`, `src/client/features/profile/ChangePassword.jsx` | Not run without a stable authenticated fixture |
| Logout | Header and profile actions dispatch the auth logout action and navigate as appropriate. | `src/client/shared/layout/HeaderAuthButton.jsx`, `src/client/features/profile/Profile.jsx` | Not run without a stable authenticated fixture |

## Smoke E2E convention

- Tests live in `e2e/` and use Playwright Test.
- `playwright.config.js` builds the Vite app, serves `dist`, and runs Chromium against `http://127.0.0.1:4173`.
- The smoke tests stub only the recipe/category/meal/review read APIs. This keeps discovery assertions deterministic while still exercising the real React routes, providers, navigation, filtering, sorting, and protected routing.
- Authenticated mutation journeys are intentionally not mocked into a false success state. They require a documented test account or a backend fixture before they can be promoted to passing E2E coverage.

## Known baseline limitations

- `package.json` defines `pnpm test` as `vitest`, but Vitest is not installed in the current checkout, so the repository test command cannot start.
- Playwright is not installed in the current checkout either. The E2E convention and tests are committed, but execution requires installing `@playwright/test` and the Chromium browser in the project environment.
- The existing `src/App.test.js` imports `./App`, which is not present in the current Vite source layout; it is not changed by Task 1 because that is unrelated product/test cleanup.
