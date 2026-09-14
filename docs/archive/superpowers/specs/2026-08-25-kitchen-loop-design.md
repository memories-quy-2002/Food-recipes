# Kitchen Loop Design

**Date:** 2026-08-25
**Status:** Approved for implementation

## Goal

Connect the existing recipe discovery, meal planning, shopping list, pantry, cooking mode, cooking history, and personalized suggestion surfaces into one practical loop:

```text
Recipe discovery
      ↓
Meal planning
      ↓
Shopping list
      ↓
Pantry availability
      ↓
Cooking mode
      ↓
Cooking history
      ↓
Personalized suggestions ↺
```

The loop must remain usable when a user enters from any individual route. It is a set of contextual handoffs, not a forced wizard.

## Existing capabilities

- `/food`, home feed, saved recipes, recipe detail, and pantry matching already support discovery.
- `/planning` stores owned meal plans and meal-plan items.
- `/shopping-list` imports ingredients from the current week and supports manual edits.
- `/pantry` stores owned ingredient availability.
- `/recipe/cooking` has guided steps and a planned-meal context.
- Suggestions already support catalog-backed `personalized` and `meal_plan` intents.

## Approved scope

### 1. Persist completed cooking sessions

Add an owned `cooking_history` record with:

- `history_id`
- `user_id`
- `recipe_id`
- optional `meal_plan_item_id`
- `servings`
- `started_at`
- `completed_at`
- `created_at`

Only a completed cooking session is written. The API validates that the recipe exists, and when a meal-plan item is provided it belongs to the current user and references the same recipe. Repeated cooking is allowed, so there is no uniqueness constraint.

Backend endpoints:

- `GET /api/v1/users/me/cooking-history`
- `POST /api/v1/users/me/cooking-history`

Responses use the existing `{ items }` / `{ item }` envelope style. All reads and writes are scoped by the authenticated user.

### 2. Connect cooking mode to history

When the final cooking step is completed, the frontend posts a history record. The Finish action is disabled while saving, prevents duplicate submissions, and gives an inline/live status when saving fails. A successful planned cook keeps the existing “Back to plan” handoff; an unplanned cook returns to the recipe after the record is saved.

The existing planned context continues to carry date, slot, servings, and return path. The plan item id is passed only after validating the current recipe context.

### 3. Add a history surface

Add protected `/history` with:

- recent completed cooks, newest first;
- recipe name, completed date, servings, and planned/unplanned context;
- links back to the recipe and cooking mode;
- useful empty, loading, and error states;
- a contextual link to planning and shopping list;
- the existing personalized `SuggestionPanel` below the history list.

Add History to authenticated navigation without replacing existing high-frequency links.

### 4. Close planning → shopping → pantry

- Planning header gets a primary secondary CTA to build the shopping list.
- Shopping list keeps planning and pantry links and imports current-week planned recipes.
- Shopping list reads pantry availability and labels unchecked ingredients already marked `have` as “In pantry”, without automatically checking or deleting them.
- Pantry keeps the shopping-list handoff and explains that availability affects matching, not purchase completion.

### 5. Feedback and accessibility

- Use the existing ToastProvider for successful mutations and concise recoverable errors.
- Keep an inline `role="status"` or `role="alert"` near the relevant action when a user needs context.
- Keep semantic links/buttons, visible focus styles, 44px minimum interactive targets, responsive layouts, and no horizontal overflow.
- Do not add ingredient checkboxes to recipe detail; checkboxes remain a shopping-list interaction only.

## Non-goals

- No unified kitchen dashboard or forced multi-step wizard.
- No automatic shopping-list completion from pantry state.
- No inferred ingredient quantity reconciliation or grocery purchasing integration.
- No recommendation model or new external data source; suggestions stay catalog-backed.
- No localStorage-only cooking history.

## Acceptance criteria

1. An authenticated user can add a recipe to a meal plan, import its ingredients, see pantry availability, start cooking from the planned context, finish once, and see the completed cook in `/history`.
2. Repeated Finish clicks do not create duplicate requests from the same active cooking screen.
3. A user cannot read or create another user’s history or attach a history item to another user’s meal-plan item.
4. Direct navigation to `/planning`, `/shopping-list`, `/pantry`, `/recipe/cooking`, and `/history` remains supported.
5. Public/unauthenticated entry points still show the existing sign-in flow instead of failing silently.
6. Focus, keyboard navigation, loading/error/empty states, responsive layouts, and live feedback are covered by focused tests plus a Playwright journey.

## Verification evidence

- Browser plugin: inspect the running `localhost:5173` app and review the connected routes visually.
- Playwright CLI: run the authenticated or stubbed kitchen-loop journey at desktop and mobile viewports.
- Frontend: typecheck, unit/component tests, build, and relevant E2E specs.
- Backend: Prisma validation, typecheck, unit tests, build, and API/E2E checks when the local database is available.
