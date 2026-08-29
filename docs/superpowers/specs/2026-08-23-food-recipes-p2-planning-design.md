# Food Recipes P2 Planning and Cooking Utility Design

**Date:** 2026-08-23
**Status:** Draft for implementation planning
**Scope:** Meal planning, manual shopping lists, and cooking-mode continuity

**Current implementation slice:** Backend API and database only. Frontend
planning and cooking-mode changes are intentionally deferred to a later slice.

## Goal

Turn saved recipes into a practical weekly cooking workflow while respecting
the current free-text ingredient model and avoiding an unreliable automatic
ingredient parser.

## Product decision

P2 is a planning utility, not a social platform. The first release persists a
user's meal plan and shopping list, supports explicit recipe slots and manual
items, and lets a user resume cooking from the plan. Nutrition automation,
pantry matching, notifications, creator follows, public collections, and AI
import remain outside this plan.

## Existing evidence

- Recipes already have ingredients and instructions as `String[]`.
- Cooking mode already supports guided step navigation and a route at
  `/recipe/cooking`.
- The frontend explicitly warns that automatic serving scaling is unavailable
  for free-text or unsupported ingredient data.
- Wishlist membership is already authenticated and can supply a recipe picker.

## Architecture

Add a `planning` Nest module with repositories for meal plans and shopping
lists. A meal plan has one owner and a bounded date range. Plan items reference
recipes by ID and store a meal slot and planned servings without copying recipe
content. A shopping list is an owner-scoped list of manually editable lines;
adding a recipe copies its current ingredient strings into the list with a
source reference, but does not merge quantities that the system cannot parse.

The frontend adds a Planning page under the authenticated profile area and a
small entry point from recipe detail. TanStack Query owns server state; form
state remains local. Cooking mode receives an optional `planItemId` so it can
show the planned date/slot and return to the plan after completion.

## API contract

### Meal plans

```text
GET    /api/v1/users/me/meal-plans?from=YYYY-MM-DD&to=YYYY-MM-DD
POST   /api/v1/users/me/meal-plans                 { name, from, to }
PATCH  /api/v1/users/me/meal-plans/:planId         { name, from, to }
DELETE /api/v1/users/me/meal-plans/:planId
POST   /api/v1/users/me/meal-plans/:planId/items   { recipeId, date, slot, servings }
PATCH  /api/v1/users/me/meal-plans/:planId/items/:itemId
DELETE /api/v1/users/me/meal-plans/:planId/items/:itemId
```

Rules:

- `name` is 1-80 characters.
- `from` and `to` are ISO dates, inclusive, with a maximum 31-day range.
- `slot` is one of `breakfast`, `lunch`, `dinner`, `snack`.
- `servings` is an integer from 1 to 24 and is planning metadata only.
- Every plan and item mutation verifies the authenticated owner.
- A missing recipe returns 404; a missing plan or item returns 404 without
  revealing another user's resource.

### Shopping list

```text
GET    /api/v1/users/me/shopping-list
POST   /api/v1/users/me/shopping-list/items       { label, quantity?, sourceRecipeId? }
PATCH  /api/v1/users/me/shopping-list/items/:itemId { label?, quantity?, checked? }
DELETE /api/v1/users/me/shopping-list/items/:itemId
POST   /api/v1/users/me/shopping-list/from-recipe { recipeId }
DELETE /api/v1/users/me/shopping-list/completed
```

`label` is 1-255 characters. `quantity` is optional display text capped at 80
characters. `sourceRecipeId` is nullable and is informational. The API never
claims that two free-text lines are equivalent.

## Data model

Use additive tables:

```sql
CREATE TABLE meal_plans (
  plan_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES accounts(user_id) ON DELETE CASCADE,
  name VARCHAR(80) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT meal_plans_date_range_check CHECK (end_date >= start_date AND end_date <= start_date + 31)
);

CREATE TABLE meal_plan_items (
  item_id SERIAL PRIMARY KEY,
  plan_id INTEGER NOT NULL REFERENCES meal_plans(plan_id) ON DELETE CASCADE,
  recipe_id INTEGER NOT NULL REFERENCES recipes(recipe_id) ON DELETE CASCADE,
  planned_date DATE NOT NULL,
  slot VARCHAR(16) NOT NULL,
  servings INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT meal_plan_items_slot_check CHECK (slot IN ('breakfast', 'lunch', 'dinner', 'snack')),
  CONSTRAINT meal_plan_items_servings_check CHECK (servings BETWEEN 1 AND 24)
);

CREATE INDEX meal_plan_items_plan_date_idx
  ON meal_plan_items (plan_id, planned_date, slot);

CREATE TABLE shopping_list_items (
  item_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES accounts(user_id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  quantity VARCHAR(80),
  source_recipe_id INTEGER REFERENCES recipes(recipe_id) ON DELETE SET NULL,
  checked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX shopping_list_user_checked_idx
  ON shopping_list_items (user_id, checked, created_at);
```

## Frontend behavior

- Profile exposes `Planning` for authenticated users.
- A user can create a plan, change the visible date range, add a saved or
  discovered recipe to a date/slot, change planned servings, and remove an
  item.
- Recipe detail exposes `Add to plan` and `Add ingredients to shopping list`.
- Shopping list supports check/uncheck, inline edit, manual add, remove, and
  clear-completed.
- Adding ingredients preserves each stored recipe string as a separate line
  and labels it with its source recipe. The UI does not display a false merged
  quantity.
- Cooking mode opened from a plan shows a small plan context and offers
  `Back to plan` after the guided flow.
- Loading, empty, conflict, not-found, and network failure states are
  explicit and preserve local edits until the user retries or discards them.

## Success criteria

- A user can plan at least one week of meals without manually copying recipe
  names or IDs.
- All plan and shopping-list mutations are owner-scoped and covered by API
  tests.
- Recipe ingredients can be copied to a shopping list without promising
  quantity normalization.
- Cooking mode can be entered from a plan and return to the same plan item.
- Existing recipe discovery, detail, wishlist, auth, and E2E suites remain
  green.

## Explicit follow-up boundary

Automatic pantry matching, ingredient normalization, nutrition calculations,
notifications, recurring plans, offline synchronization, and public sharing
require separate designs because they introduce different data ownership and
consistency requirements.
