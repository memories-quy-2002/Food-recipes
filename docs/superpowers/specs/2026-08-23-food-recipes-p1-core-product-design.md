# Food Recipes P1 Core Product Completion Design

**Date:** 2026-08-23
**Status:** Draft for implementation planning
**Scope:** Recipe lifecycle, review reporting, saved collections

**Current implementation slice:** Backend API and database only. The frontend
consumer work described below is intentionally deferred to a later slice.

## Goal

Complete the core loop from discovering a recipe to owning, saving, organizing,
and safely discussing it without introducing a second API or a parallel data
model.

## Existing evidence

- The Nest API already exposes owner-scoped `PATCH /recipes/:id`, recipe rating
  mutations, public review reads, and wishlist membership.
- The frontend does not expose recipe editing from the profile flow.
- Review reporting is explicitly unavailable because no report endpoint exists.
- Saved collections are explicitly unsupported because the API only persists
  saved-recipe membership.

## In scope

1. Edit an owned recipe with the existing recipe editor and Nest DTO contract.
2. Let an authenticated user report a review, and let an authorized admin
   resolve or dismiss reports.
3. Let an authenticated user create and manage named saved collections.
4. Add ownership, authorization, validation, and focused browser/API tests for
   these flows.

## Out of scope

- Follow/creator feeds, comments, notifications, AI recipe import, and social
  sharing feeds.
- Rich-text recipe content or a rewrite of the existing recipe editor.
- Automatic ingredient normalization. Existing ingredients remain `String[]`.
- Public collection discovery. Collections are private to their owner in P1.
- Anonymous review reporting. Reporting requires an authenticated account.

## Architecture

The backend keeps the current Nest module boundaries and raw-SQL repository
style used for the legacy PostgreSQL schema. Collection persistence is additive
through `saved_collections` and `saved_collection_items`. Review reports are
additive through `review_reports`; report state is a constrained string so the
legacy database does not need a PostgreSQL enum migration.

The frontend keeps feature ownership under `src/frontend/features`. The recipe
editor is reused for create and edit modes. API mutations continue through the
existing Axios client and route registry. All protected actions derive the
account identity from the JWT; request bodies and route params never select the
acting user.

Admin moderation depends on the role/authorization foundation defined in the
Security Hardening design. Until that foundation is implemented, the report
write endpoint may be delivered independently, but the admin queue must not be
exposed as a user-accessible route.

## API contract

### Recipe edit

Existing route, no new path:

```text
PATCH /api/v1/recipes/:id
Authorization: Bearer <access-token>
```

The service verifies that the authenticated user owns `:id`. The request uses
the existing partial `CreateRecipeDto` shape. The response remains
`{ recipe: RecipeRecord }` and returns HTTP 200.

### Saved collections

```text
GET    /api/v1/users/me/collections
POST   /api/v1/users/me/collections                 { name }
PATCH  /api/v1/users/me/collections/:collectionId   { name }
DELETE /api/v1/users/me/collections/:collectionId
POST   /api/v1/users/me/collections/:collectionId/recipes { recipeId }
DELETE /api/v1/users/me/collections/:collectionId/recipes/:recipeId
```

Collection names are trimmed, 1-80 Unicode characters, and unique per user
case-insensitively. A collection can contain a recipe only once. Adding a
missing recipe returns 404. Accessing another user's collection returns 404 to
avoid leaking collection existence. Deleting a collection removes only its
membership rows and never deletes recipes.

The list response is:

```ts
type Collection = {
  collection_id: number;
  name: string;
  recipe_count: number;
  created_at: string;
  updated_at: string;
};
```

### Review reporting

```text
POST /api/v1/recipes/:recipeId/reviews/:ratingId/report
Authorization: Bearer <access-token>
{ reason: "spam" | "abuse" | "unsafe" | "copyright" | "other", details?: string }
```

The service verifies that the rating belongs to `:recipeId` before inserting a
report. Duplicate open reports by the same reporter for the same rating are
rejected with HTTP 409. `details` is optional and capped at 1000 characters.

Admin-only routes, enabled after the Security role guard exists:

```text
GET   /api/v1/admin/review-reports?status=open&page=1&limit=20
PATCH /api/v1/admin/review-reports/:reportId
       { status: "resolved" | "dismissed", note?: string }
```

Admin responses never include password hashes, refresh tokens, or unrelated
profile fields.

## Data model

Add one migration without resetting or rewriting the existing baseline:

```sql
CREATE TABLE saved_collections (
  collection_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES accounts(user_id) ON DELETE CASCADE,
  name VARCHAR(80) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX saved_collections_user_name_key
  ON saved_collections (user_id, LOWER(name));

CREATE TABLE saved_collection_items (
  collection_item_id SERIAL PRIMARY KEY,
  collection_id INTEGER NOT NULL REFERENCES saved_collections(collection_id) ON DELETE CASCADE,
  recipe_id INTEGER NOT NULL REFERENCES recipes(recipe_id) ON DELETE CASCADE,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT saved_collection_recipe_key UNIQUE (collection_id, recipe_id)
);

CREATE INDEX saved_collection_items_recipe_idx
  ON saved_collection_items (recipe_id);

CREATE TABLE review_reports (
  report_id SERIAL PRIMARY KEY,
  rating_id INTEGER NOT NULL REFERENCES rating(rating_id) ON DELETE CASCADE,
  recipe_id INTEGER NOT NULL REFERENCES recipes(recipe_id) ON DELETE CASCADE,
  reporter_user_id INTEGER NOT NULL REFERENCES accounts(user_id) ON DELETE CASCADE,
  reason VARCHAR(32) NOT NULL,
  details VARCHAR(1000),
  status VARCHAR(16) NOT NULL DEFAULT 'open',
  resolution_note VARCHAR(1000),
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP(6),
  resolved_by INTEGER REFERENCES accounts(user_id) ON DELETE SET NULL,
  CONSTRAINT review_reports_reason_check CHECK (reason IN ('spam', 'abuse', 'unsafe', 'copyright', 'other')),
  CONSTRAINT review_reports_status_check CHECK (status IN ('open', 'resolved', 'dismissed'))
);

CREATE UNIQUE INDEX review_reports_open_report_key
  ON review_reports (rating_id, reporter_user_id)
  WHERE status = 'open';
```

The migration must use the repository's existing naming and timestamp
precision conventions if the live baseline requires a compatible variation.
The migration validator and Prisma schema representation must agree with the
SQL migration.

## Frontend behavior

- Profile's own recipe list exposes `Edit` beside `Delete`.
- Edit opens the existing recipe form with current values loaded from
  `GET /recipes/:id`. Submitting sends `PATCH`, preserves the current image URL
  when no new image is selected, and returns to Profile after success.
- The edit form shows loading, not-found, forbidden, validation, and save
  failure states without losing the draft input.
- Saved shows an `Organize` action for each recipe, a collection selector, and a
  create-collection form. Collection changes are optimistic only after the API
  response succeeds; failed mutations restore the previous state and show a
  dismissible error.
- Review cards show `Report` only to authenticated users. A report dialog
  requires a reason, optionally accepts details, and confirms success without
  exposing moderation state.
- Admin moderation is a separate route and is not linked into normal user
  navigation until role enforcement is active.

## Success criteria

- An owner can edit name, description, taxonomy, duration, ingredients,
  instructions, and image URL; another user receives 403.
- A user cannot read, mutate, or delete another user's collection.
- Duplicate collection names and duplicate collection recipe memberships have
  deterministic 409 responses.
- A report is tied to the correct recipe and rating, cannot be duplicated while
  open, and can be resolved only by an admin.
- Browser tests cover create/edit/save/organize/report happy paths and the
  protected/ownership failures.
- Existing frontend 17-test journey suite, backend tests, and static validators
  remain green.

## Rollout and compatibility

Run the additive migration before enabling collection UI. Ship recipe edit and
report submission behind the existing authenticated routes. Enable admin report
queue only after Security role tests pass. No existing recipe, wishlist, rating,
or response field is removed.
