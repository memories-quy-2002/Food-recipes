# Task 5 report: recommendation integration into Suggestions

Date: 2026-08-28
Branch: `feat/p0-p1-growth-retention`
Base: Task 4 recommendation service commit `351f6fa`

## Scope and worktree boundary

Implemented Task 5 from `.superpowers/sdd/task-5-brief.md`. The existing untracked design and implementation-plan documents were preserved and were not staged:

- `docs/superpowers/plans/2026-08-28-food-recipes-p0-p1-growth-retention-plan.md`
- `docs/superpowers/specs/2026-08-28-food-recipes-p0-p1-growth-retention-design.md`

No frontend code, controller code, recommendation engine code, database schema or migration was changed.

## Integration findings

- `RecommendationService.recommend(userId, { limit, surface })` is the exported class-token provider from `RecommendationsModule`.
- The engine returns `RankedRecipe` values containing `recipeId`, `score` and `reasons`, not legacy Suggestions recipe metadata.
- `SuggestionsModule` therefore imports `RecommendationsModule` and injects `RecommendationService` using `RecommendationServicePort` for typing.
- The Suggestions repository hydrates published recipe metadata by ranked IDs; the service restores engine order and maps the engine score to legacy `match_score`.

## Implementation

- Authenticated `personalized` requests delegate to the engine with `{ limit: 6, surface: 'suggestions' }`.
- Authenticated `meal_plan` requests delegate to the engine with `{ limit: 6, surface: 'meal-plan' }`.
- Ranked recipe IDs are hydrated through a single published-recipe lookup and returned in engine order.
- All engine reasons are joined into the existing singular `reason` response field, preserving the existing Suggestions response shape.
- The existing `catalog_rules` source, disclaimer, recipe metadata fields and `match_score` field remain present.
- `ingredient_match` and `substitution` continue using their existing repository methods and logic.
- Missing user IDs still raise the existing `SUGGESTIONS_AUTH_REQUIRED` error before any recommendation call.
- The old category-based `findPersonalized` and meal-plan repository methods remain in place and are no longer selected by private Suggestions requests; no unrelated suggestion logic was refactored.

## Files changed

- `.superpowers/sdd/task-5-report.md`
- `src/backend/src/modules/suggestions/suggestions.module.ts`
- `src/backend/src/modules/suggestions/suggestions.repository.ts`
- `src/backend/src/modules/suggestions/suggestions.service.spec.ts`
- `src/backend/src/modules/suggestions/suggestions.service.ts`

## TDD RED/GREEN evidence

### RED

After adding the service tests and before adding the recommendation dependency to `SuggestionsService`:

```text
corepack pnpm@11.18.0 test -- suggestions --runInBand
```

Result: failed as expected during TypeScript compilation with `TS2554: Expected 1 arguments, but got 2` because the new test contract required the missing recommendation service constructor dependency.

### GREEN

After adding the minimal module import, service delegation/hydration, repository lookup and test dependency setup:

```text
corepack pnpm@11.18.0 test -- suggestions --runInBand
```

Result:

```text
Test Suites: 2 passed, 2 total
Tests:       7 passed, 7 total
```

The focused tests cover authenticated personalized delegation, engine reason propagation, legacy response fields, meal-plan surface selection, unauthenticated behavior and unchanged ingredient/substitution paths.

## Verification

```text
pnpm run typecheck
```

Result: passed.

```text
pnpm run build
```

Result: passed.

```text
pnpm run prisma:validate
```

Result: passed. Prisma reported that the schema is valid.

```text
pnpm run check
```

Result:

```text
Test Suites: 41 passed, 41 total
Tests:       205 passed, 205 total
User food preferences migration validation passed.
```

```text
git diff --check
```

Result: passed with no whitespace errors. Git emitted existing CRLF-to-LF working-copy warnings for the four modified Suggestions files; these were warnings only.

## Self-review

- `SuggestionsModule` imports the module that actually exports `RecommendationService`; it does not invent a new token or duplicate the engine provider.
- The public controller still invokes `suggest(dto)` without a user, so private intents retain the existing unauthorized behavior.
- The authenticated controller still supplies only `CurrentUser().id`; no client actor field or internal recommendation breakdown is accepted.
- The six-result limit matches the existing Suggestions repository behavior.
- Hydration is bounded by the engine result set, filters to published recipes, and preserves engine ranking independently of database row order.
- Engine `reasons` are exposed only through the existing human-readable `reason` field; scorer breakdowns and internal weights are not returned.
- `ingredient_match`, `substitution`, the response envelope, and the legacy repository implementations remain unchanged.
- Only the four briefed implementation files and this report are intended for the task commit. The two pre-existing untracked docs remain unstaged.

## Concerns

- No live database integration test was added; the repository hydration query is covered by TypeScript/build validation and the service delegation is covered by focused unit tests.
- The required branch-local worktree contains the two pre-existing untracked design/plan documents; they were intentionally left untouched and unstaged.
