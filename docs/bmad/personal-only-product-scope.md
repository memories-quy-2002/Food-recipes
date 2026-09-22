# Personal-only product scope

Status: personal-only implementation complete; initial cooking-progress UX delivered
Owner: Product owner
Last updated: 2026-09-22

## Problem and outcome

Food Recipes is intended for one person planning and cooking their own meals.
Household membership, invitations, roles, and shared kitchen scopes are outside
that product direction.

The application continues to support public recipe discovery and individual
accounts, saved recipes, plans, shopping, pantry, cooking history, leftovers,
and journals. Personal ownership is enforced by the backend.

## Scope delivered

- Removed household creation, invitations, membership management, role screens,
  scope selection, and active household API controllers/routes.
- Removed household-only service paths and household notification generation.
- Personal planning, shopping, pantry, leftovers, cooking sessions, and
  recommendations are scoped to the authenticated account.
- Kept public recipes, publishing, ratings, reviews, private notes, and recipe
  links.
- Changed the default serving count for new food preferences to one person.
- Updated maintained developer docs, prompts, BMAD guidance, and the Wiki.
- Delivered the first personal cooking-progress recap and recipe-memory surfaces described below.

## Data and compatibility boundary

No production data is deleted or converted. Existing household-scoped records,
membership tables, invitation tables, and nullable scope columns remain in the
database as legacy data. Personal APIs do not expose records with a non-null
household scope, and household-specific controllers are no longer registered.
A separate approved backup, retention, and migration plan is required before
dropping legacy schema or deleting/reassigning those rows.

Changing the schema default for servings affects new preference rows only.
Existing user preference values are preserved.

## Acceptance criteria

- [x] No household route, menu item, invitation flow, member/role flow, or
  personal/household scope selector remains in the frontend.
- [x] Pantry, meal-plan, shopping, leftover, and cooking-session UI call only
  the authenticated user's routes.
- [x] No household API controller is registered; no household API route is
  documented as current.
- [x] Household-only authorization branches are removed from active service
  paths, while personal ownership checks remain server-side.
- [x] Legacy household-scoped records are retained without being silently
  reassigned or exposed by personal endpoints.
- [x] The product brief, API contract, journeys, Wiki indexes/pages, and
  repository guidance describe the solo-cooking scope.
- [x] The personal cooking recap and recipe memory are implemented; optional
  progress markers remain proposed.

## Personal cooking-progress UX

The user selected cooking progress as the primary personal UX goal.

### Delivered

- The authenticated History page shows lifetime completed-cook and distinct
  recipe totals plus the most-cooked recipe.
- Authenticated recipe detail shows the user's lifetime cook count, latest cook
  date and servings, and the latest private journal rating, repeat choice, and
  notes. The journal link returns to that recipe after saving.
- The existing History "Cook again" action remains the replay entry point.

### Still proposed

Optional progress markers may let the user choose a small set of cooking goals
or techniques to practice. Keep them private and avoid public comparison,
streak pressure, nutrition scoring, or mandatory logging. Treat them as a
separate future decision; do not add food diaries or gamification without user
research.

## Research notes

A 2024 systematic review and meta-analysis covered 19 studies with 3,261
participants and concluded that feedback is important in self-monitoring
interventions, while more research is needed to determine which feedback
formats work best ([review](https://pubmed.ncbi.nlm.nih.gov/38178230/)). This
evidence concerns dietary and weight-related interventions, not cooking-history
dashboards; applying it to a lightweight personal cooking recap is an
inference to validate with users, not a guaranteed outcome.

## Verification boundary

Automated tests, builds, and browser journeys have not been run for the recap and
recipe-memory implementation. The source, API response ownership, and maintained
documentation received static review only.

## References

- [Product brief](./product-brief.md)
- [Current API contract](../backend/current-api-contract.md)
- [Current user journeys](../frontend/current-user-journeys.md)
- [Wiki index](../../Wiki/index.md)