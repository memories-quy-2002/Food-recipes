# Kitchen Continuity Upgrade

**Date:** 2026-08-27
**Status:** Implemented

## Goal

Make the existing recipe loop understandable at a glance and resumable after a user leaves the current page:

```text
Choose a recipe -> Plan it -> Prepare it -> Cook it -> Finish it -> Cook it again
```

The application keeps contextual handoffs instead of forcing users through a wizard.

## Scope

### Kitchen command center

Authenticated home feed responses expose an owned kitchen state containing:

- the most recently updated active or paused cooking session;
- the next planned meal;
- open and completed shopping counts;
- available pantry count;
- saved, planned, and completed-cook counts for the onboarding checklist.

The frontend presents these as one primary “Your kitchen at a glance” surface with one clear CTA per state.

### Cooking continuity

Cooking mode continues to use the server cooking session as the source of truth for step progress. Ingredient checklist and manual timer state are persisted in browser storage scoped to the user and recipe. Timers persist an absolute end timestamp so reloading does not reset elapsed time.

### Meal preparation

An authenticated preparation endpoint compares structured recipe ingredients with the owned pantry and adds only missing quantities to the owned shopping list. Legacy or unquantified ingredients are shown as needing details and are added without an unsafe inferred quantity.

### Lifecycle visibility

Meal-plan items expose a derived status: `planned`, `cooking`, or `completed`. The status and matching action are visible in planning cards.

### Onboarding

The home command center includes a dismissible, locally persisted checklist. It explains the loop without blocking users who prefer to enter through another route.

## Security

- Kitchen state, preparation, and cooking status queries are protected by `JwtAuthGuard`.
- All repository queries are scoped by the authenticated `userId`.
- Recipe and meal-plan IDs are validated by DTOs and ownership checks before mutation.
- SQL uses Prisma tagged parameters; no user value is interpolated into raw SQL.
- Preparation never trusts client pantry data; the server recalculates availability.
- Response DTOs expose only recipe and progress metadata, never credentials or private account fields.

## Acceptance criteria

1. An authenticated user can open Home and immediately see the current next action, if one exists.
2. An active or paused cook can be resumed from Home, History, or Planning with its existing step and planned context.
3. Refreshing cooking mode preserves the ingredient checklist and timer state for the same user and recipe.
4. Preparing a planned meal reports available and missing ingredients and adds only missing items to the user's shopping list.
5. Planning cards distinguish planned, cooking, and completed meals and use a matching primary action.
6. A new user can understand the recipe loop from the onboarding checklist, dismiss it, and return later without losing its state.
7. A user cannot read or mutate another user's kitchen state, pantry, shopping list, plan, or cooking session.

## Verification

- Backend typecheck, Prisma validation, and focused home-feed, planning, and preparation tests.
- Frontend typecheck and focused component/storage tests.
- Existing frontend and backend test suites plus the relevant kitchen-loop journey.
