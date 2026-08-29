# Food Recipes P0/P1 Growth & Retention Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Implement the P0 personalization/weekly-habit loop and P1 collaboration/re-engagement capabilities while preserving the existing modular NestJS + React architecture.

**Architecture:** Add focused modules for preferences, recommendations, households, notifications, imports and journals. Extend existing home-feed, pantry, planning, history and shopping modules. Keep ranking deterministic, PostgreSQL-backed and explainable.

**Tech Stack:** TypeScript, NestJS, PostgreSQL, Prisma 7, React, Vite, TanStack Query, React Hook Form, Zod, Tailwind CSS v4, shadcn/ui, Jest, React Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-28-food-recipes-p0-p1-growth-retention-design.md`

---

# Global Constraints

- Keep the application a modular monolith.
- No Kafka, Kubernetes, Elasticsearch, GraphQL, vector database or ML pipeline.
- Allergens are hard exclusions.
- Recommendations expose reasons.
- Client never supplies the acting `userId`.
- Additive migrations only.
- All user-facing changes must work at 360px.
- All tasks follow TDD:
  - failing test;
  - verify failure;
  - minimal implementation;
  - verify pass;
  - commit.
- Run affected package `check` before each PR checkpoint.
- Run relevant Playwright journeys before merge.

---

# Suggested PR Sequence

```text
PR 1  Food Preferences foundation
PR 2  Recommendation Engine v2
PR 3  Personalized Home v2
PR 4  Pantry expiration / Use Soon
PR 5  Smart Weekly Planner
PR 6  Household foundation
PR 7  Shared pantry/planning/shopping
PR 8  Contextual notifications
PR 9  Recipe URL import
PR 10 Cooking journal
PR 11 Product analytics + final E2E hardening
```

---

# P0

## Task 1 — Preference persistence

**Files**

Modify:

```text
src/backend/prisma/schema.prisma
```

Create:

```text
src/backend/prisma/migrations/<timestamp>_user_food_preferences/migration.sql
```

Tests:

```text
src/backend/test/*
```

### Steps

- [ ] Add failing schema/migration contract test.
- [ ] Run focused backend test and verify failure.
- [ ] Add:
  - `UserFoodPreference`;
  - `UserAvoidedAllergen`;
  - `UserDislikedIngredient`;
  - `UserCuisinePreference`.
- [ ] Add SQL constraints:

```sql
CHECK (default_servings BETWEEN 1 AND 24);
CHECK (
  max_weekday_cook_minutes IS NULL
  OR max_weekday_cook_minutes BETWEEN 10 AND 240
);
CHECK (
  max_calories_per_serving IS NULL
  OR max_calories_per_serving BETWEEN 100 AND 5000
);
CHECK (
  min_protein_grams IS NULL
  OR min_protein_grams BETWEEN 0 AND 300
);
CHECK (weight BETWEEN -2 AND 2);
```

- [ ] Run:

```bash
cd src/backend
corepack pnpm@11.18.0 prisma:validate
corepack pnpm@11.18.0 check
```

- [ ] Commit:

```bash
git commit -m "feat(preferences): add food preference persistence"
```

---

## Task 2 — Preferences backend API

Create:

```text
src/backend/src/modules/preferences/preferences.module.ts
src/backend/src/modules/preferences/preferences.controller.ts
src/backend/src/modules/preferences/preferences.service.ts
src/backend/src/modules/preferences/preferences.repository.ts
src/backend/src/modules/preferences/dto/update-food-preferences.dto.ts
src/backend/src/modules/preferences/preferences.service.spec.ts
```

Modify:

```text
src/backend/src/app.module.ts
```

### API

```text
GET /api/v1/users/me/food-preferences
PUT /api/v1/users/me/food-preferences
```

### Test cases

- [ ] Empty user returns defaults.
- [ ] Replace is transactional.
- [ ] Child arrays are trimmed and deduplicated.
- [ ] Invalid servings rejected.
- [ ] Invalid nutrition bounds rejected.
- [ ] User cannot select another actor.

### Implementation constraints

Repository update must use a transaction:

```ts
await prisma.$transaction(async (tx) => {
  // upsert scalar preference
  // delete child values
  // insert normalized child values
});
```

### Verification

```bash
cd src/backend
corepack pnpm@11.18.0 test -- preferences --runInBand
corepack pnpm@11.18.0 check
```

### Commit

```bash
git commit -m "feat(preferences): expose food preference API"
```

---

## Task 3 — Preferences frontend

Create:

```text
src/frontend/features/preferences/api/preferencesApi.ts
src/frontend/features/preferences/api/preferencesQueries.ts
src/frontend/features/preferences/FoodPreferencesPage.tsx
src/frontend/features/preferences/FoodPreferencesPage.test.tsx
```

Modify:

```text
src/frontend/app/AppRoutes.tsx
src/frontend/shared/layout/*
```

### Route

```text
/profile/preferences
```

### Tests

- [ ] API values populate form.
- [ ] Chip input works by keyboard.
- [ ] Invalid values block submit.
- [ ] Save error preserves draft.
- [ ] Success invalidates preference query.
- [ ] Mobile layout works without horizontal scroll.

### Verification

```bash
cd src/frontend
pnpm test -- FoodPreferencesPage.test.tsx
pnpm check
```

### Commit

```bash
git commit -m "feat(preferences): add food preference settings"
```

---

## Task 4 — Recommendation scoring core

Create:

```text
src/backend/src/modules/recommendations/recommendations.module.ts
src/backend/src/modules/recommendations/recommendation-context.service.ts
src/backend/src/modules/recommendations/recommendation-candidates.repository.ts
src/backend/src/modules/recommendations/recommendation-scorer.ts
src/backend/src/modules/recommendations/recommendation.service.ts
src/backend/src/modules/recommendations/recommendation-scorer.spec.ts
src/backend/src/modules/recommendations/recommendation.service.spec.ts
```

### Core interface

```ts
type RecommendationSurface =
  | 'home'
  | 'suggestions'
  | 'meal-plan';

type RankedRecipe = {
  recipeId: number;
  score: number;
  reasons: string[];
};

interface RecommendationService {
  recommend(
    userId: number,
    input: {
      limit: number;
      surface: RecommendationSurface;
    },
  ): Promise<RankedRecipe[]>;
}
```

### Scorer tests

- [ ] avoided allergen returns exclusion.
- [ ] strict dislike excludes.
- [ ] pantry coverage raises score.
- [ ] high-protein preference rewards recipe.
- [ ] cook-time preference rewards short recipe.
- [ ] recently cooked recipe gets novelty penalty.
- [ ] expiring ingredient raises waste-reduction score.
- [ ] score remains in `[0, 1]`.
- [ ] reasons are non-empty.

### Candidate query

Target:

```text
<= 150 published recipes
```

Query must bulk-load:

```text
ratings
nutrition
dietary tags
allergens
structured ingredients
```

Avoid N+1 queries.

### Verification

```bash
cd src/backend
corepack pnpm@11.18.0 test -- recommendations --runInBand
corepack pnpm@11.18.0 check
```

### Commit

```bash
git commit -m "feat(recommendations): add explainable ranking engine"
```

---

## Task 5 — Integrate recommendations into Suggestions

Modify:

```text
src/backend/src/modules/suggestions/suggestions.module.ts
src/backend/src/modules/suggestions/suggestions.service.ts
src/backend/src/modules/suggestions/suggestions.repository.ts
src/backend/src/modules/suggestions/suggestions.service.spec.ts
```

### Change

For:

```text
personalized
meal_plan
```

delegate to `RecommendationService`.

Keep compatible:

```text
ingredient_match
substitution
```

### Tests

- [ ] authenticated personalized request delegates to engine.
- [ ] reasons propagate.
- [ ] unauthenticated behavior unchanged.
- [ ] response schema remains backward-compatible.

### Verification

```bash
corepack pnpm@11.18.0 test -- suggestions --runInBand
```

### Commit

```bash
git commit -m "feat(suggestions): use recommendation engine"
```

---

## Task 6 — Personalized Home Feed v2 backend

Modify:

```text
src/backend/src/modules/home-feed/home-feed.service.ts
src/backend/src/modules/home-feed/home-feed.repository.ts
src/backend/src/modules/home-feed/*.spec.ts
```

### New section behavior

```text
continue
use_soon
recommended
planned
saved
popular
```

### Service behavior

Home should:

1. resume current cooking;
2. show next plan;
3. show use-soon;
4. show ranked recommendations;
5. show saved;
6. show exploration.

### Resilience

Use `Promise.allSettled` or equivalent isolated fallback for optional personalized sections.

Do not fail the whole Home response because recommendations failed.

### Verification

```bash
corepack pnpm@11.18.0 test -- home-feed --runInBand
corepack pnpm@11.18.0 check
```

### Commit

```bash
git commit -m "feat(home): add contextual personalized feed"
```

---

## Task 7 — Personalized Home Feed v2 frontend

Modify:

```text
src/frontend/features/home/PersonalizedHomeFeed.tsx
src/frontend/features/home/KitchenCommandCenter.tsx
src/frontend/features/home/Home.tsx
src/frontend/features/home/api/*
```

Create or modify tests:

```text
src/frontend/features/home/*.test.tsx
```

### UI rules

Recommendation cards show:

```text
reason
time
rating
pantry relevance
```

Example:

```text
Chicken Teriyaki

24 min
Uses 7 ingredients from your pantry
Matches your high-protein preference
```

### Tests

- [ ] reason text renders.
- [ ] fallback sections render if recommendation list is empty.
- [ ] command center remains primary.
- [ ] keyboard navigation remains valid.
- [ ] screen-reader section headings are meaningful.

### Verification

```bash
cd src/frontend
pnpm test -- PersonalizedHomeFeed
pnpm check
```

### Commit

```bash
git commit -m "feat(home): surface personalized recommendation reasons"
```

---

## Task 8 — Pantry expiration persistence/API

Modify:

```text
src/backend/prisma/schema.prisma
src/backend/src/modules/pantry/*
```

Add fields:

```text
purchasedAt
openedAt
expiresAt
storageLocation
```

### API behavior

Pantry create/update supports optional dates/location.

Response adds:

```ts
expiry_status: 'none' | 'fresh' | 'use_soon' | 'expired';
```

### Tests

- [ ] yesterday => expired.
- [ ] today => use_soon.
- [ ] +3 days => use_soon.
- [ ] +4 days => fresh.
- [ ] null => none.

### Verification

```bash
cd src/backend
corepack pnpm@11.18.0 prisma:validate
corepack pnpm@11.18.0 test -- pantry --runInBand
```

### Commit

```bash
git commit -m "feat(pantry): track expiration and storage"
```

---

## Task 9 — Pantry Use Soon frontend

Modify:

```text
src/frontend/features/pantry/*
src/frontend/features/home/*
```

### UX

Add:

```text
expiry date
storage location
use soon badge
expired warning
find recipes action
```

### Tests

- [ ] expiry state accessible by text, not color only.
- [ ] expired item warns before being treated as available.
- [ ] `Find recipes` navigates with use-soon context.

### Verification

```bash
cd src/frontend
pnpm test -- pantry
pnpm check
```

### Commit

```bash
git commit -m "feat(pantry): add use-soon workflow"
```

---

## Task 10 — Meal-plan generation backend

Modify/create:

```text
src/backend/src/modules/planning/meal-plan-generator.service.ts
src/backend/src/modules/planning/meal-plan-generator.service.spec.ts
src/backend/src/modules/planning/*
```

### API

```text
POST /api/v1/users/me/meal-plans/generate-preview
POST /api/v1/users/me/meal-plans/from-preview
```

### Generator algorithm

```ts
for each requested slot:
  candidates = filterHardConstraints(candidates);

  ranked = rank(candidates);

  ranked = applyDiversityPenalty(
    ranked,
    selectedRecipes,
  );

  choose highest valid candidate;
```

### Preview security

Server returns opaque:

```text
previewToken
```

Persist only after revalidation.

### Tests

- [ ] allergen recipe never selected.
- [ ] locked item preserved.
- [ ] duplicate recipes avoided when alternatives exist.
- [ ] target meal count respected.
- [ ] impossible plan returns stable error.
- [ ] persisted plan cannot trust manipulated client recipe IDs.

### Verification

```bash
cd src/backend
corepack pnpm@11.18.0 test -- meal-plan-generator --runInBand
corepack pnpm@11.18.0 check
```

### Commit

```bash
git commit -m "feat(planning): generate personalized weekly plans"
```

---

## Task 11 — Smart Weekly Planner frontend

Modify:

```text
src/frontend/features/planning/*
```

Create:

```text
src/frontend/features/planning/GenerateMealPlanDialog.tsx
src/frontend/features/planning/GeneratedPlanPreview.tsx
```

### User actions

```text
Generate
Swap one meal
Lock meal
Regenerate unlocked
Save
Cancel
```

### Tests

- [ ] preview does not persist automatically.
- [ ] lock survives regenerate.
- [ ] swap only changes one target.
- [ ] save handles server revalidation failure.
- [ ] mobile UI does not require drag/drop.

### Verification

```bash
cd src/frontend
pnpm test -- planning
pnpm check
pnpm test:e2e:ci
```

### Commit

```bash
git commit -m "feat(planning): add smart weekly planner"
```

---

# P1

## Task 12 — Household persistence

Modify:

```text
src/backend/prisma/schema.prisma
```

Create migration for:

```text
Household
HouseholdMember
HouseholdInvite
```

Extend:

```text
PantryItem
MealPlan
ShoppingListItem
```

with nullable:

```text
householdId
```

### Ownership constraint

For every shareable row:

```sql
CHECK (
  (user_id IS NOT NULL AND household_id IS NULL)
  OR
  (user_id IS NULL AND household_id IS NOT NULL)
);
```

Existing rows remain personal.

### Verification

```bash
corepack pnpm@11.18.0 prisma:validate
corepack pnpm@11.18.0 check
```

### Commit

```bash
git commit -m "feat(households): add household ownership model"
```

---

## Task 13 — Household access layer

Create:

```text
src/backend/src/modules/households/households.module.ts
src/backend/src/modules/households/households.service.ts
src/backend/src/modules/households/households.repository.ts
src/backend/src/modules/households/household-access.service.ts
src/backend/src/modules/households/household-role.guard.ts
src/backend/src/modules/households/*.spec.ts
```

### Interface

```ts
type HouseholdRole =
  | 'OWNER'
  | 'MEMBER'
  | 'VIEWER';

interface HouseholdAccessService {
  requireRole(
    userId: number,
    householdId: number,
    allowed: readonly HouseholdRole[],
  ): Promise<void>;
}
```

### Tests

- [ ] owner access.
- [ ] member access.
- [ ] viewer read.
- [ ] viewer mutation denied.
- [ ] unrelated user denied.

### Commit

```bash
git commit -m "feat(households): add shared access control"
```

---

## Task 14 — Household lifecycle and invites

Create:

```text
src/backend/src/modules/households/households.controller.ts
src/backend/src/modules/households/dto/*
```

### API

```text
POST   /api/v1/households
GET    /api/v1/households
GET    /api/v1/households/:householdId
POST   /api/v1/households/:householdId/invites
POST   /api/v1/household-invites/:token/accept
PATCH  /api/v1/households/:householdId/members/:memberId
DELETE /api/v1/households/:householdId/members/:memberId
```

### Invite token

Generate random token.

Store only:

```text
SHA-256(token)
```

Return/send raw token once.

### Tests

- [ ] expired invite rejected.
- [ ] replayed invite rejected.
- [ ] non-owner cannot invite.
- [ ] owner cannot remove final owner without transferring ownership.

### Commit

```bash
git commit -m "feat(households): add membership and invites"
```

---

## Task 15 — Shared pantry / plan / shopping

Modify:

```text
src/backend/src/modules/pantry/*
src/backend/src/modules/planning/*
src/backend/src/modules/shopping/*
```

### New routes

```text
/households/:householdId/pantry
/households/:householdId/meal-plans
/households/:householdId/shopping-list
```

### Requirement

Do not silently reuse `/users/me/*`.

Scope must be explicit.

### Tests

- [ ] personal and household rows cannot leak into each other.
- [ ] member can edit shared resources.
- [ ] viewer cannot mutate.
- [ ] user from another household cannot read.

### Commit

```bash
git commit -m "feat(households): share kitchen resources"
```

---

## Task 16 — Household frontend

Create:

```text
src/frontend/features/households/*
```

Modify:

```text
src/frontend/app/AppRoutes.tsx
src/frontend/shared/layout/*
src/frontend/features/pantry/*
src/frontend/features/planning/*
src/frontend/features/shopping/*
```

### UX

Allow explicit switch:

```text
Personal kitchen
Smith Household
```

The scope selector must be visible when a user belongs to households.

### Tests

- [ ] switching scope invalidates relevant query keys.
- [ ] viewer controls render read-only.
- [ ] invite flow handles invalid/expired token.
- [ ] mobile scope switch remains usable.

### Commit

```bash
git commit -m "feat(households): add shared kitchen UI"
```

---

## Task 17 — Notification persistence/API

Create:

```text
src/backend/src/modules/notifications/notifications.module.ts
src/backend/src/modules/notifications/notifications.controller.ts
src/backend/src/modules/notifications/notifications.service.ts
src/backend/src/modules/notifications/notifications.repository.ts
src/backend/src/modules/notifications/notification-rules.service.ts
src/backend/src/modules/notifications/notification-preferences.controller.ts
```

Modify Prisma schema.

### API

```text
GET   /api/v1/users/me/notifications
PATCH /api/v1/users/me/notifications/:id/read
POST  /api/v1/users/me/notifications/read-all

GET /api/v1/users/me/notification-preferences
PUT /api/v1/users/me/notification-preferences
```

### Dedupe examples

```text
pantry-expiry:<pantryId>:<date>
meal-reminder:<planItemId>:<date>
resume-cooking:<sessionId>:<date>
```

### Tests

- [ ] duplicate semantic reminder not created.
- [ ] disabled preference suppresses optional notification.
- [ ] household invite still created.
- [ ] notification belongs only to target user.

### Commit

```bash
git commit -m "feat(notifications): add contextual in-app alerts"
```

---

## Task 18 — Notification generation and frontend

Create:

```text
src/frontend/features/notifications/*
```

Modify:

```text
src/frontend/shared/layout/*
```

### Initial generation triggers

```text
pantry expiration
next planned meal
paused cooking
weekly plan ending
household invite/activity
```

Start synchronous/on-demand where possible.

Do not add BullMQ yet unless scheduled persistence requires it.

### Frontend tests

- [ ] unread count.
- [ ] mark read.
- [ ] read all.
- [ ] internal action link navigation.
- [ ] preference toggles.

### Commit

```bash
git commit -m "feat(notifications): surface actionable reminders"
```

---

## Task 19 — Safe recipe URL importer

Create:

```text
src/backend/src/modules/recipe-imports/recipe-imports.module.ts
src/backend/src/modules/recipe-imports/recipe-imports.controller.ts
src/backend/src/modules/recipe-imports/recipe-imports.service.ts
src/backend/src/modules/recipe-imports/recipe-fetcher.service.ts
src/backend/src/modules/recipe-imports/recipe-jsonld.parser.ts
src/backend/src/modules/recipe-imports/*.spec.ts
```

### Fetcher limits

```text
scheme: http/https
timeout: 5s
max response: 2 MB
redirect checks: required
content-type: text/html
```

### SSRF tests

Reject:

```text
127.0.0.1
::1
localhost
10.0.0.0/8
172.16.0.0/12
192.168.0.0/16
169.254.0.0/16
```

Also reject public URL redirecting to private address.

### Parser tests

Support:

```text
single Recipe object
@graph containing Recipe
array containing Recipe
```

### Commit

```bash
git commit -m "feat(import): add safe recipe JSON-LD importer"
```

---

## Task 20 — Recipe import frontend

Create:

```text
src/frontend/features/recipe-import/*
```

Modify:

```text
src/frontend/app/AppRoutes.tsx
src/frontend/features/profile/*
src/frontend/features/recipes/*
```

### UX

```text
Paste URL
  ↓
Preview
  ↓
Edit fields
  ↓
Save draft
```

### Tests

- [ ] invalid URL.
- [ ] unsupported recipe page.
- [ ] timeout error.
- [ ] preview editable.
- [ ] imported recipe saved as draft only.

### Commit

```bash
git commit -m "feat(import): add recipe import workflow"
```

---

## Task 21 — Cooking Journal backend

Modify Prisma schema.

Create:

```text
src/backend/src/modules/journals/journals.module.ts
src/backend/src/modules/journals/journals.controller.ts
src/backend/src/modules/journals/journals.service.ts
src/backend/src/modules/journals/journals.repository.ts
src/backend/src/modules/journals/*.spec.ts
```

### API

```text
GET /api/v1/users/me/cooking-history/:historyId/journal
PUT /api/v1/users/me/cooking-history/:historyId/journal
```

### Tests

- [ ] user can journal own history.
- [ ] cannot journal another user's history.
- [ ] rating 1–5.
- [ ] journal rating does not mutate public `Rating`.
- [ ] `wouldCookAgain` is persisted.

### Commit

```bash
git commit -m "feat(journal): add private cooking journal"
```

---

## Task 22 — Journal photos and frontend

Create/modify:

```text
src/frontend/features/journal/*
src/frontend/features/history/*
src/backend/src/modules/media/*
```

### Photo rules

Use existing media/storage pipeline.

Validate:

```text
image only
configured size limit
owner-scoped upload
```

### UX

After completing cooking:

```text
rating
would cook again
notes
photos
```

### Tests

- [ ] completion flow links to journal.
- [ ] save preserves history.
- [ ] photo upload failure does not erase text draft.

### Commit

```bash
git commit -m "feat(journal): add post-cook reflection"
```

---

## Task 23 — Removed: PWA shell and offline read cache

Product decision on 2026-08-28: offline/PWA support is out of scope. No service worker, manifest, IndexedDB cache, or offline release gate is maintained.

---

## Task 24 — Removed: Offline mutation queue

Product decision on 2026-08-28: shopping and cooking mutations require an active network connection and use the normal API request path. No client-side outbox or reconnect sync is maintained.

---

# Cross-cutting

## Task 25 — Product analytics port

Create:

```text
src/backend/src/common/analytics/product-analytics.port.ts
src/backend/src/common/analytics/product-analytics.service.ts
src/frontend/shared/analytics/*
```

### Events

```text
recommendation_impression
recommendation_opened
meal_plan_generated
meal_plan_saved
pantry_use_soon_opened
cooking_started
cooking_completed
recipe_repeated
household_invite_sent
household_invite_accepted
recipe_import_completed
notification_opened
```

### Requirements

- no PII;
- no JWT;
- no journal text;
- no invite token;
- no free-text ingredient payload.

### Tests

Verify event payload shape.

### Commit

```bash
git commit -m "feat(analytics): instrument retention funnel"
```

---

## Task 26 — OpenTelemetry instrumentation

Extend existing telemetry/bootstrap.

Add spans/metrics for:

```text
recommendation.compute
meal_plan.generate
recipe_import.fetch
recipe_import.parse
notification.generate
```

### Attributes allowed

```text
surface
candidate_count
result_count
duration
status
```

### Forbidden

```text
email
JWT
journal note
invite token
ingredient free text
```

### Commit

```bash
git commit -m "chore(observability): instrument growth workflows"
```

---

## Task 27 — End-to-end retention journeys

Add Playwright tests:

```text
preferences → personalized home
pantry expiry → use soon → recipe
generate plan → save → prepare → cook
household invite → shared shopping
recipe URL → preview → draft
complete cook → journal
```

### Verification

Frontend:

```bash
cd src/frontend
pnpm check
pnpm test:e2e:ci
```

Backend:

```bash
cd src/backend
corepack pnpm@11.18.0 check
corepack pnpm@11.18.0 build
corepack pnpm@11.18.0 test:e2e
corepack pnpm@11.18.0 prisma:validate
```

### Commit

```bash
git commit -m "test: cover p0 p1 retention journeys"
```

---

# Final Release Gates

P0 release gate:

- [ ] Preferences migration applied.
- [ ] Recommendation safety tests green.
- [ ] Personalized Home p95 acceptable.
- [ ] Weekly planner preview/persist E2E green.
- [ ] Existing cooking workflow green.

P1 release gate:

- [ ] Household RBAC integration tests green.
- [ ] Invite replay/expiry tests green.
- [ ] Recipe import SSRF suite green.
- [ ] Journal privacy tests green.
- [ ] Full frontend/backend quality gates green.

---

# Recommended Execution Strategy

Use one worktree/branch per major PR.

Suggested branch progression:

```text
feat/p0-preferences
feat/p0-recommendations
feat/p0-home-feed-v2
feat/p0-pantry-expiry
feat/p0-smart-planner
feat/p1-households
feat/p1-notifications
feat/p1-recipe-import
feat/p1-cooking-journal
```

Preferred Superpowers execution mode:

```text
superpowers:subagent-driven-development
```

Use `superpowers:verification-before-completion` before every PR completion claim.
