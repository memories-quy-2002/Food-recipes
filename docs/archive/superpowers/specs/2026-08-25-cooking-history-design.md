# Cooking History Design

## Status

Approved direction for implementation planning.

## Goal

Persist a private history of recipes a signed-in user completes in Cooking Mode, then expose a small protected history page with recipe details and a “Cook again” action.

## Current context

- Cooking Mode tracks step progress and displays a completion state, but completion is currently local UI state.
- Recipe detail already knows the recipe identity and routes to `/recipe/cooking`.
- Meal plans already pass planned date, slot, and servings into Cooking Mode.
- No cooking-history table or frontend route currently exists.

## Product behavior

1. A signed-in user who activates `Finish cooking` on a recipe with instructions creates one history event.
2. The event stores recipe ID, servings used, and completion timestamp. Meal-plan context may affect the displayed completion copy, but history does not add a planning foreign key.
3. Completion is recorded once per Cooking Mode session even if the user double-clicks or revisits the completion view.
4. Guests can use Cooking Mode normally, but completion is not persisted and does not interrupt the flow.
5. Add protected `/history` and a Profile link named `Cooking history`.
6. History displays newest first with recipe image, name, meal/category, completion date, servings, and a `Cook again` link to `/recipe/cooking?id=<id>`.
7. A missing, deleted, or no-longer-public recipe is shown as unavailable with its event date retained; it does not break the page.
8. Provide `Clear history` with explicit confirmation. Clearing history deletes only the current user's events.

## Architecture

Add a feature-oriented NestJS `cooking-history` module with repository, service, controller, DTOs, and tests. Use a new additive `cooking_history` table because history is an event stream and must support repeated cooking of the same recipe.

```sql
cooking_history (
  history_id serial primary key,
  user_id integer not null,
  recipe_id integer not null,
  servings integer not null default 1,
  cooked_at timestamptz not null default current_timestamp
)
```

Add indexes on `(user_id, cooked_at desc)` and `(user_id, recipe_id)`. Expose:

- `GET /api/v1/users/me/cooking-history?limit=20`
- `POST /api/v1/users/me/cooking-history`
- `DELETE /api/v1/users/me/cooking-history/:historyId`
- `DELETE /api/v1/users/me/cooking-history`

The create DTO accepts `recipeId` and `servings`; the server verifies the recipe exists and normalizes servings to the existing allowed range. The list query joins public recipe fields without exposing another user's data.

The frontend adds `cookingHistoryApi.ts`, `cookingHistoryQueries.ts`, `CookingHistoryPage.tsx`, and a small `useRecordCookingHistory` mutation. `CookingMode` emits an `onComplete` callback; `Recipe.jsx` owns the authenticated mutation and passes it down so the cooking component remains presentational.

## Error and privacy behavior

- History is private and always derived from the JWT user; no `userId` route parameter is accepted.
- Recording failure does not prevent the user from seeing the completion state. Show a non-blocking retry/action message.
- A retry for the same session is guarded in the client; a duplicate event is not treated as a fatal error.
- Clear-history and individual-delete actions require confirmation.
- History does not appear in public recipe responses, public feeds, analytics payloads, or other users' profiles.

## Accessibility and testing

- The completion announcement remains an `aria-live` status and includes the recording state only when relevant.
- History uses a semantic list, descriptive links, visible focus, and mobile one-column cards.
- Backend tests cover create/list/delete/clear ownership, missing recipes, and validation.
- Frontend tests cover authenticated and guest completion, one-time recording, non-blocking failure, list states, and clear confirmation.
- Playwright covers completing a recipe, opening history, cooking again, and clearing history with a deterministic API fixture.
- Axe and keyboard checks cover the completion state, history page, and confirmation dialog.

## Out of scope

- Public activity feeds, followers, streaks, achievements, nutrition analytics, automatic plan completion, or notifications.
