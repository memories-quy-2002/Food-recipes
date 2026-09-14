# Task 6 Report: Personalized Home Feed v2 Backend

Date: 2026-08-28
Branch: `feat/p0-p1-growth-retention`
Base: recommendation engine commit `351f6fa`; Suggestions integration commit `0dd3152`

## Scope

Implemented Task 6 from `.superpowers/sdd/task-6-brief.md`.

The pre-existing untracked design and implementation-plan documents were preserved and were not staged:

- `docs/superpowers/plans/2026-08-28-food-recipes-p0-p1-growth-retention-plan.md`
- `docs/superpowers/specs/2026-08-28-food-recipes-p0-p1-growth-retention-design.md`

No Prisma schema, migration, frontend implementation, or unrelated infrastructure was changed.

## Contract Resolution

The authenticated Home response now returns these top-level sections in this exact order:

```text
continue
use_soon
recommended
planned
saved
popular
```

Each section preserves the existing `key`, `title`, `description`, and `recipes` fields.

`continue` and `planned` additionally expose a `context` field:

```json
{
  "key": "continue",
  "recipes": [],
  "context": {
    "active_session": {}
  }
}
```

```json
{
  "key": "planned",
  "recipes": [],
  "context": {
    "next_meal": {}
  }
}
```

The existing top-level `kitchen` object remains present and unchanged on successful personalized requests. This keeps the current `KitchenCommandCenter` consumer compatible while making the required contextual sections independently consumable.

The public Home response remains unchanged: `quick` followed by `popular`, both with the existing limits and copy. `quick` remains in the backend section key type for that public contract.

## Implementation

### Service

- Injected the existing `RecommendationService` provider optionally through `RecommendationsModule`.
- Authenticated recommendations use the engine with `{ limit: 8, surface: 'home' }`.
- Ranked recipe IDs are hydrated through the Home feed repository and then restored to engine order.
- Published hydration results expose the engine's `recommendation_score` and human-readable `reasons` fields without exposing internal weights.
- `listPlanned(userId, 6)`, `listSaved(userId, 6)`, `listPopular(8)`, and the current pantry query `listFromPantry(userId, 8)` remain bounded and user-scoped.
- The current pantry-match query is mapped to `use_soon` without adding expiry schema in this task. Actual expiry-aware selection belongs to the later pantry expiration task.

### Resilience

Personalized sections are loaded with `Promise.allSettled` so one optional failure cannot reject the Home response.

Explicit fallbacks are:

- rejected `planned`, `use_soon`, `recommended`, `saved`, or `popular` loads produce an empty `recipes` array;
- a rejected kitchen-state load omits `kitchen` and emits null active/next contexts rather than fabricating ownership data;
- a missing recommendation provider produces an empty `recommended` section;
- recommendation engine or hydration failure produces an empty `recommended` section, rather than falling back to the older query that lacks the engine's hard-exclusion guarantees.

The legacy `listRecommended` repository method remains available but is no longer used by the v2 personalized path.

### Repository

- Added `findPublishedByIds(recipeIds)` for one bounded hydration query.
- Hydration filters to published recipes server-side.
- Hydration uses the existing recipe projection and normalization path.
- The existing `pantry_match_count` query result is now represented and normalized as an optional recipe field.

### API documentation

Updated the Home response DTO to document:

- `use_soon`, `planned`, and the preserved public `quick` key;
- optional section context;
- optional `pantry_match_count`, `recommendation_score`, and `reasons` recipe fields.

### Ownership

The authenticated controller continues to call `getPersonalizedFeed(user.id)` using `CurrentUser().id`. No client-provided actor or ownership field was added. Repository queries use that server-derived ID for planned, pantry, saved, kitchen, and recommendation context data.

## TDD Evidence

### RED

Added failing service tests for:

- the six-section order;
- active cooking and next planned meal contexts;
- recommendation-engine delegation and ranked hydration;
- isolated fallback when pantry or recommendation loading fails.

Before production changes:

```text
corepack pnpm@11.18.0 test -- home-feed --runInBand
```

Result:

```text
FAIL src/modules/home-feed/home-feed.service.spec.ts
TS2554: Expected 1 arguments, but got 2.
```

The failure was caused by the new test requiring the missing recommendation service constructor dependency.

### GREEN

After the minimal service, repository, module, and DTO changes:

```text
corepack pnpm@11.18.0 test -- home-feed --runInBand
```

Result:

```text
Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
```

## Verification

Passed:

```text
corepack pnpm@11.18.0 test -- home-feed --runInBand
```

```text
pnpm check
```

Result:

```text
Test Suites: 41 passed, 41 total
Tests:       206 passed, 206 total
User food preferences migration validation passed.
```

Passed:

```text
corepack pnpm@11.18.0 typecheck
corepack pnpm@11.18.0 build
corepack pnpm@11.18.0 prisma:validate
git diff --check
```

Prisma reported that the schema is valid. `git diff --check` reported no whitespace errors; Git emitted only the existing CRLF-to-LF working-copy warning for the modified module file.

The exact requested full-check command could not run in this environment:

```text
corepack pnpm@11.18.0 check
```

Corepack invoked pnpm v11.24.0 and refused to run against the package's pinned pnpm v11.18.0. The same `check` script passed when invoked directly as `pnpm check` with the available binary. Project configuration was not changed to bypass the mismatch.

## Self-Review

- The personalized response has exactly the requested six sections and ordering.
- The public quick/popular response remains unchanged.
- Existing kitchen fields remain available on successful authenticated responses.
- Active cooking and next planned meal are not hidden inside `kitchen`; each has a top-level section context.
- Recommendation ranking is preserved independently of database row order.
- Hydration filters unpublished or missing recipes and cannot return a recipe absent from the engine result.
- Recommendation failures cannot reject the entire Home response.
- Fallbacks do not expose a lower-safety legacy recommendation result.
- User ownership is derived from the authenticated request and is not accepted from the client.
- No schema, migration, external dependency, or unrelated infrastructure was added.
- The DTO declaration order was checked through the full Swagger bootstrap suite after an initial runtime decorator-order failure.
- Only the Task 6 implementation files and this report are intended for the commit; the two pre-existing untracked roadmap documents remain untouched and unstaged.

## Concerns

- `use_soon` currently reuses the existing available-pantry matching query because pantry expiration persistence is a later roadmap task and no expiry column exists in the current schema. It is an explicit compatibility bridge, not an expiry guarantee.
- The existing frontend contract and renderer still use the pre-v2 `pantry` key/type and do not yet render section context; that is the separately scoped Task 7 frontend work. The existing kitchen consumer remains compatible because `kitchen` is preserved.
- No live database integration test was added for the new hydration query; service ranking/fallback behavior is covered by focused tests, while build, full test, Swagger, and Prisma validation passed.
