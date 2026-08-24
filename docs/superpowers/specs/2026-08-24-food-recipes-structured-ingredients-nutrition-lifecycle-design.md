# Structured Ingredients, Nutrition, and Recipe Lifecycle

## Status

Approved for implementation on 2026-08-24.

## Context

The current recipe aggregate stores `ingredients` and `instructions` as legacy string arrays and the create form immediately publishes a recipe. That is sufficient for the original catalog, but it cannot represent quantities and units consistently, cannot show nutrition or dietary fit, and cannot distinguish a private working draft from a public recipe.

This feature adds the missing domain capabilities without breaking the existing recipe response contract or the planning flow that still consumes the legacy ingredient array.

## Product decisions

1. Structured ingredients are persisted as ordered relational rows. Each row keeps the original free-text value for safe migration and editing, while exposing optional quantity, unit, ingredient name, and preparation notes.
2. Nutrition is manual MVP data. Users enter per-serving values; the system validates and displays the values but does not call a nutrition provider or calculate values from ingredients.
3. Dietary preferences are explicit tags on recipes. A user can also save dietary preferences in their profile; the MVP uses those preferences for visible labels/filtering and does not attempt medical advice or hidden allergen inference.
4. Recipe lifecycle is `draft`, `published`, or `archived`. New form saves create a draft, publish validates the publish requirements, archive removes a recipe from the public catalog, and restore returns an archived recipe to draft.
5. Existing rows are backfilled as `published`. Existing `ingredients: string[]` remains in API responses and is retained as a compatibility projection for planning and older clients.
6. Published edits stay published in this MVP. Revision history and moderation workflows are explicitly deferred.
7. Public list/detail endpoints return published recipes only. Owner endpoints can return all statuses and include lifecycle metadata.

## Domain shape

### Recipe lifecycle

```text
draft --publish--> published --archive--> archived
  ^                    |                    |
  |                    +-- edit -----------+
  +------------- restore ------------------+
```

`publishedAt` and `archivedAt` are nullable timestamps. `updatedAt` changes on every aggregate update. Status values are stored as a constrained string to avoid introducing a Prisma enum into the existing raw-SQL repository style.

### Structured ingredient

Each row belongs to one recipe and has a stable position:

```ts
{
  id: number;
  position: number;
  quantity: number | null;
  quantityText: string | null;
  unit: string | null;
  name: string;
  preparation: string | null;
  originalText: string | null;
}
```

`quantityText` supports values such as `1/2` without forcing a lossy numeric conversion. `originalText` preserves imported legacy text. The compatibility `ingredients` array is generated from the submitted structured rows when rows are changed.

### Nutrition and dietary metadata

Nutrition is one row per recipe with nullable manual values for calories, protein, carbohydrates, fat, fiber, sugar, and sodium, plus a `servings` value. Dietary tags and allergen tags are normalized child rows with unique `(recipe_id, tag)` pairs.

## API contract

All routes are under the existing `/api/v1` prefix and use the existing bearer-auth guard for owner operations.

Existing routes remain compatible:

- `GET /recipes` and `GET /recipes/:id` expose published recipes only.
- `POST /recipes` remains a compatibility path for existing clients and creates a published recipe using the existing DTO shape.
- `PATCH /recipes/:id` keeps owner checks and may update compatible core fields; published edits remain published.
- `DELETE /recipes/:id` remains the existing owner-only hard delete.

New owner routes:

- `POST /users/me/recipes/drafts` creates a draft from the same core recipe payload, allowing the image and publish-only fields to be absent.
- `GET /users/me/recipes?status=all|draft|published|archived` lists the owner’s recipes and status metadata. `all` is the default.
- `PUT /recipes/:id/ingredients` replaces the ordered structured ingredient collection and updates the legacy projection.
- `PUT /recipes/:id/nutrition` replaces manual nutrition values.
- `PUT /recipes/:id/dietary-tags` replaces dietary and allergen tags.
- `POST /recipes/:id/publish` validates the publish contract and transitions a draft to published.
- `POST /recipes/:id/archive` transitions a published recipe to archived.
- `POST /recipes/:id/restore` transitions an archived recipe to draft.

The frontend uses the draft endpoint and explicit publish endpoint. Server failures retain the local draft fallback already present in the form.

## Publish validation

Publishing requires the existing core fields (name, category, meal, positive preparation and cooking times, at least one ingredient, and at least one instruction) plus an image. Structured ingredient rows must have a non-empty name. Nutrition and dietary tags are optional in the MVP.

## Compatibility and migration

The migration is additive:

- Add lifecycle columns to `recipes` with existing rows set to `published`.
- Create structured ingredient, nutrition, dietary tag, and allergen tag tables.
- Backfill one structured ingredient row per legacy array item, preserving order and original text. The name is initially the trimmed legacy string; quantity/unit parsing is intentionally not inferred.
- Keep legacy arrays unchanged for older consumers.

No destructive reset, data rewrite, or automatic nutrition calculation is allowed.

## Frontend experience

- Add Recipe has three actions: `Save draft`, `Publish`, and `Discard local draft`. Save draft persists to the server when authenticated and also updates local storage; Publish saves the current structured/nutrition/tag data and then calls the lifecycle endpoint.
- Ingredients use repeatable structured rows with quantity, unit, name, and preparation fields, while retaining a compact free-text fallback for restored legacy drafts.
- Nutrition has a manual per-serving section with numeric inputs and a short disclosure that values are user-entered.
- Dietary preferences use selectable chips for dietary tags and allergen tags.
- Personal Recipes shows status tabs/badges and owner actions for publish, archive, restore, view, and delete.
- Recipe detail shows structured ingredients, nutrition, and dietary metadata when available and falls back to legacy arrays when not.
- All new controls remain keyboard accessible and preserve the existing responsive visual system.

## Out of scope

- automatic nutrition providers or ingredient matching;
- medical, allergy, or safety guarantees;
- recipe revision history, moderation queues, scheduled publishing, or status-specific permissions beyond ownership;
- removing or renaming the legacy `ingredients` response field;
- a broad redesign of unrelated pages.

## Acceptance criteria

- Existing recipe and planning tests continue to pass.
- A legacy recipe can be read through the current public API with the same legacy ingredient array and newly available published metadata.
- An authenticated user can save a draft with incomplete publish-only data, reload it from the owner list, add structured ingredients and manual nutrition, publish it, archive it, and restore it to draft.
- Public catalog queries never return drafts or archived recipes.
- Owner checks prevent users from changing another user’s recipe.
- Backend typecheck, unit tests, build, Prisma validation, and the affected frontend checks pass.
