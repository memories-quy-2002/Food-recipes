# Recipe Editing Design

## Status

Approved direction for implementation planning.

## Goal

Allow an authenticated recipe owner to edit an existing draft, published recipe, or archived recipe through the same structured editor used to create recipes, while preserving server-side ownership and the existing recipe lifecycle.

## Current context

- `PATCH /api/v1/recipes/:id` already updates the owned recipe's base fields.
- `PUT /api/v1/recipes/:id/ingredients`, `/nutrition`, and `/dietary-tags` already replace owned structured metadata.
- `POST /api/v1/recipes/:id/publish`, `/archive`, and `/restore` already enforce lifecycle transitions.
- `GET /api/v1/users/me/recipes?status=all` is the owner-scoped source for personal recipes and drafts.
- The frontend exposes create, publish, archive, restore, and delete, but does not expose an edit route or action.

## Product behavior

1. Add an `Edit` action to every recipe in the authenticated user's Personal Recipes list.
2. Open `/food/edit?id=<recipeId>` behind `ProtectedRoute`.
3. Load the selected recipe from the owner-scoped recipe list. Never use the public recipe endpoint to load a draft.
4. Reuse the existing recipe editor fields and validation: name, description, category, meal, preparation/cooking time, image, structured ingredients, instructions, servings, manual nutrition, dietary tags, and allergen declarations.
5. Saving an edit updates the base recipe and then replaces the structured metadata through the existing owner-scoped endpoints. The UI reports which section failed and does not show a false success message.
6. Published edits remain published. Editing does not implicitly archive, unpublish, or create a revision history.
7. Drafts retain the existing `Save draft` and `Publish` actions. Archived recipes can be edited only after the owner explicitly restores them to draft.
8. After a successful save, navigate to the updated recipe for published content or back to Personal Recipes for drafts, and invalidate the relevant recipe/profile queries.
9. Guests are sent through the existing account flow with the original edit destination preserved.

## Architecture

Introduce a focused `RecipeEditor` component that owns form state and persistence. Keep `AddRecipe.jsx` as the create-mode entry point and add a thin `EditRecipe.jsx` route entry point that supplies the owner recipe and edit mode. Do not duplicate validation, draft serialization, image handling, or metadata payload construction.

The editor's save orchestration uses the existing Axios client and route helpers. It calls the base `PATCH` first, then the three structured replacement endpoints only for sections represented by the form. A successful response refreshes the owner recipe list and public recipe detail. The backend remains the authority for ownership, lifecycle, validation, and publication readiness.

## API and data contracts

No new backend endpoint or migration is required. Add typed frontend route helpers and a small editor save function with this shape:

```ts
type RecipeEditPayload = {
  base: UpdateRecipePayload;
  ingredients?: ReplaceRecipeIngredientsPayload;
  nutrition?: ReplaceRecipeNutritionPayload;
  tags?: ReplaceRecipeTagsPayload;
};

saveRecipeEdits(recipeId: number, payload: RecipeEditPayload): Promise<RecipeDetail>;
```

The current owner-scoped `GET /users/me/recipes?status=all` response must include the editor fields already returned by the recipe repository. If a field is absent from that contract, extend the existing owner list projection rather than exposing another user-parameterized endpoint.

## Error and security behavior

- A missing owner recipe renders a not-found state with a link back to Personal Recipes.
- `401` follows the existing protected-route behavior.
- `403` and `404` are shown as an ownership/not-found error without exposing whether another user's recipe exists.
- Validation errors remain field-associated and preserve server messages only when they are safe user-facing validation copy.
- A failed structured section prevents navigation and offers retry; the editor keeps the user's entered values.
- Image upload failures do not discard the rest of the form.

## Accessibility and responsive behavior

- Reuse the existing labelled inputs, field errors, focus-visible styles, and 44px action targets.
- Announce loading, save progress, success, and failure through `role="status"`/`role="alert"` without moving focus unexpectedly.
- The edit page works at desktop and 390px mobile widths without horizontal scrolling.
- Keyboard users can reach every ingredient/instruction row, add/remove control, lifecycle action, and save action.

## Testing and acceptance criteria

- Backend regression tests prove existing update ownership and lifecycle behavior remains unchanged.
- Frontend component tests cover loading an owner recipe, hydrating structured fields, validation, base-plus-metadata save order, partial failure, and successful navigation.
- Personal Recipes tests prove Edit appears for owned recipes and uses the correct route.
- Playwright covers opening Edit, changing a field, saving, and seeing the updated recipe; it also covers a draft and an ownership failure fixture.
- Accessibility checks cover form labels, error association, keyboard operation, focus-visible states, and mobile no-overflow.

## Out of scope

- Revision history, collaborative editing, scheduled publishing, moderation queues, and automatic ingredient parsing.
- Any new editor dependency or broad rewrite of unrelated profile pages.
