# Profile Hybrid Redesign Design

**Date:** 2026-08-27
**Status:** Ready for user review

## Goal

Redesign the authenticated Profile experience so it works as a clear personal kitchen hub while remaining useful for account management. The page should be orderly, predictable, responsive, and low-friction rather than visually elaborate.

The redesign keeps the existing frontend architecture and backend contracts for the first implementation phase. It adds a lightweight Overview page, separates account settings from user content, and preserves the existing recipe and review workflows.

## Current state

- `src/frontend/features/profile/Profile.tsx` renders a two-column profile shell with a sidebar and a lazy-loaded main section.
- The current Profile pages are Personal info, Change password, My recipes, and My reviews.
- Section navigation is implemented with hash values such as `#/password`, `#/recipes`, and `#/reviews`.
- Personal info updates `PUT /users/me/profile` and currently edits full name, phone number, and address.
- Change password updates `PUT /users/me/password` and validates the current password, new password, and confirmation.
- My recipes loads `/users/me/recipes` and supports draft, published, and archived lifecycle actions.
- My reviews loads `/users/me/ratings` and links users back to the recipe page to edit a review.
- The application already has separate protected routes for saved recipes, planning, shopping list, pantry, and cooking history.
- `src/frontend/features/profile/Profile.scss` contains selectors for an older profile markup structure. The current profile JSX primarily uses Tailwind classes, so the redesign must not extend the stale selector tree as the primary styling approach.
- Profile currently requests reviews from its top-level effect whenever an authenticated user exists, even when the active section is not My reviews.

## Product principles

- Make the next useful action obvious without turning Profile into an analytics dashboard.
- Keep account settings and user-created content visibly separate.
- Do not display fabricated counts, completion percentages, or activity metrics.
- Prefer visible labels for primary actions over icon-only controls.
- Preserve existing user data, mutation behavior, loading states, empty states, and error recovery.
- Keep the first phase frontend-only unless an existing backend contract is insufficient for a required behavior.

## Scope

### Included

- A new Profile Overview as the default `/profile` view.
- A reorganized Profile sidebar with Overview, Account, Your content, and Logout groups.
- Explicit personal-info navigation while retaining existing password, recipes, and reviews hash destinations.
- A compact account summary with name, email, and links to account settings.
- Quick actions to Add a recipe, View saved recipes, and open relevant cooking areas.
- On-demand loading of recipes and reviews when their sections are opened.
- Personal info form improvements including cancel behavior and explicit save state.
- Change password form improvements including visible requirements, local field errors, and show/hide controls.
- Clear, labeled actions and consistent responsive behavior for My recipes and My reviews.
- Focus, accessible navigation state, semantic headings, touch targets, and focused component tests.

### Excluded

- Avatar upload or image storage.
- Email verification or email-change workflows.
- New database migrations.
- A new profile summary endpoint in the first phase.
- Replacing the router, state management, API client, or styling system.
- Moving Saved recipes, Meal planning, Shopping list, Pantry, or Cooking history into the Profile route tree.
- New analytics, charts, activity timelines, or fabricated statistics.
- Broad redesign of the application header or other protected pages.

## Information architecture

The Profile route remains protected at `/profile`.

```text
/profile                  -> Overview
/profile#/personal-info   -> Personal info
/profile#/password        -> Change password
/profile#/recipes         -> My recipes
/profile#/reviews         -> My reviews
```

The existing named destinations `#/password`, `#/recipes`, and `#/reviews` remain valid. The current `#/` hash remains an alias for Personal info so previously generated links do not unexpectedly open Overview. New navigation uses the explicit `#/personal-info` destination. A bare `/profile` with no hash opens Overview. Existing application links to `/profile` therefore land on the new useful default rather than directly on a form.

The sidebar structure is:

```text
Overview

Account
- Personal info
- Change password

Your content
- My recipes
- My reviews

Log out
```

Saved recipes, Meal planning, Shopping list, Pantry, and Cooking history remain dedicated routes. Overview may link to them as related actions, but the Profile sidebar does not become a second application-wide navigation.

## Component structure

The existing feature boundary remains in place.

```text
Profile
├── ProfileAside
├── ProfileMain
│   ├── ProfileOverview
│   ├── PersonalInfo
│   ├── ChangePassword
│   ├── PersonalRecipes
│   └── Reviews
└── shared loading/error/empty states
```

### `Profile`

- Owns the active Profile section derived from the URL hash.
- Owns the logout mutation and toast behavior.
- Passes authenticated user data and section state to the shell.
- Does not fetch reviews or recipes for sections that are not active.
- Keeps the current lazy loading boundary for the main Profile content where it remains useful.

### `ProfileAside`

- Renders grouped navigation with semantic list and navigation structure.
- Uses links for section changes so browser navigation and deep links continue to work.
- Sets `aria-current="page"` on the active section.
- Renders Logout separately from navigation links.
- Uses a responsive presentation that remains keyboard accessible on narrow screens.

### `ProfileOverview`

- Renders the welcome heading and primary quick actions.
- Renders the account summary card.
- Renders links to user content and existing cooking routes.
- Uses auth-state user data only in the first phase.
- Does not make additional network requests solely to populate a dashboard.

### Existing content components

- `PersonalInfo` remains responsible for profile form state and profile mutation.
- `ChangePassword` remains responsible for password validation and password mutation.
- `PersonalRecipes` remains responsible for recipe listing, status filtering, lifecycle mutations, and delete confirmation.
- `Reviews` remains responsible for ratings and review display and navigation to recipe editing.

## Overview design

### Header

The Overview header contains:

- `Welcome back, {name}` using a safe fallback when a name is unavailable.
- One short description explaining that the page combines account management and kitchen activity.
- A primary `Add a recipe` action navigating to `/food/add`.
- A secondary `View saved recipes` action navigating to `/wishlist`.

### Account summary

The account summary contains:

- A default profile icon or initials; no upload affordance.
- Full name.
- Email as read-only account information when available.
- `Edit personal info` linking to `#/personal-info`.
- `Change password` linking to `#/password`.

The summary must not claim that an email is verified unless the frontend has a reliable verification field and behavior for that state.

### Kitchen links

The Overview content area contains labeled links for:

- My recipes: manage drafts, published recipes, and archived recipes.
- My reviews: revisit ratings and written notes.
- Saved recipes: open the existing wishlist route.
- Meal planning: open the existing planning route.
- Cooking history: open the existing history route.

These are navigation cards or list items, not fake metric cards. If a future summary endpoint provides authoritative counts, counts can be added without changing the navigation model.

## Account settings design

### Personal info

The form remains limited to fields supported by the current profile contract:

- Full name, editable.
- Email, read-only display.
- Phone number, editable.
- Address, editable.

Interaction rules:

- Save is disabled when the form matches its initial values.
- Cancel is shown or enabled when local changes exist and restores the last loaded values.
- Submit disables duplicate submission and exposes a `Saving...` state.
- Successful submission updates the auth user state and clears the dirty state.
- Failed submission keeps the entered values and exposes a retry path.
- Existing `name`, `tel`, and `street-address` autocomplete semantics remain.

### Change password

The form continues to contain current password, new password, and confirmation fields.

Interaction rules:

- The minimum eight-character requirement is visible before submission.
- Validation errors are associated with the relevant field where possible.
- A general alert remains available for server or form-level errors.
- Each password field may expose a show/hide control with an accessible label.
- Submit disables duplicate requests and exposes a saving state.
- Success clears all password values and announces the result.
- The user remains signed in after a successful password change because the current backend contract does not require session invalidation.

## My recipes design

The existing status filters remain: All, Draft, Published, and Archived.

Each recipe item includes:

- Recipe image with the existing fallback behavior.
- Recipe name with a safe draft fallback.
- Category and meal metadata when available.
- A status badge.
- Only the lifecycle actions valid for that status.

Primary actions use visible labels where layout permits. The action set remains:

- Draft: Edit, Publish, Delete.
- Published: View, Edit, Archive, Delete.
- Archived: Restore, Delete.

Delete remains destructive and requires confirmation. A lifecycle mutation disables only the affected recipe item. Loading, error, empty, and retry states remain explicit. The header includes `Add a recipe`.

## My reviews design

Each review item includes:

- Recipe image and name.
- Star rating and numeric score.
- Written review or `No written review yet.` when empty.
- Review date when provided by the API.
- A clearly labeled action to view the recipe and edit the review.

The existing ratings and comments summary can remain because both values are derived from the loaded review response. It must not be presented as account-wide activity analytics.

Reviews are fetched when the Reviews section becomes active. If loading fails, the page exposes a clear error state and retry action. If no reviews exist, the empty state links to `/food`.

## Data flow and error handling

The first phase uses existing contracts:

```text
auth state
  -> Profile shell and ProfileOverview

active hash section
  -> section component
  -> existing endpoint on demand
  -> local/query state
  -> loading, success, empty, or error UI
```

The Profile shell must not eagerly request every personal resource. In particular, review loading moves out of the unconditional top-level effect and becomes conditional on the active Reviews section, or is owned by the Reviews component if that produces a cleaner boundary.

All unknown API errors continue through a safe error-message normalizer. No error response is rendered directly without checking its shape. Existing toast behavior remains for mutations, while page-level load failures retain inline retry actions.

## Responsive and accessibility behavior

- Desktop retains a two-column layout with a sticky sidebar where space allows.
- Mobile uses a single-column layout and a horizontally scrollable or compact section navigation that remains keyboard accessible.
- The active section is exposed through `aria-current`.
- Headings follow one page-level heading and ordered section headings.
- Email and disabled form values remain readable and distinguishable from editable fields.
- Primary actions have visible text and touch targets of at least 44 CSS pixels where practical.
- Focus indicators use the existing global focus-visible treatment.
- Hash navigation must not leave focus stranded; when a section changes, focus should move to the new section heading or another stable section landmark without disrupting normal browser navigation.
- Delete confirmation retains dialog labeling, modal semantics, keyboard dismissal, and focus return to the triggering control.
- Responsive layouts must not create unintended page-level horizontal scrolling at narrow widths.

## Verification strategy

Add or update focused frontend tests for:

- Bare `/profile` resolving to Overview.
- Explicit navigation to personal info, password, recipes, and reviews.
- Grouped navigation and active `aria-current` state.
- Overview quick actions pointing to `/food/add`, `/wishlist`, `/planning`, and `/history` as applicable.
- Personal info dirty state, cancel behavior, successful save, duplicate-submit protection, and failed save preservation.
- Change password validation, server error display, show/hide controls, and success reset.
- My recipes status filtering and lifecycle action behavior, including the existing delete confirmation path.
- Reviews loading only when the Reviews section is active, plus loading, empty, error, and retry behavior.
- Narrow viewport navigation and absence of page-level overflow.

Run from `src/frontend`:

```powershell
pnpm typecheck
pnpm lint
pnpm test:ci
pnpm build
```

Run the relevant Profile and authenticated route journeys when a stable authenticated test fixture is available. Do not describe mutation E2E coverage as passing when the environment lacks a real authenticated fixture.

## Acceptance criteria

1. `/profile` opens a useful Overview by default.
2. Account settings and user content are visibly separated in Profile navigation.
3. Existing password, recipe, review, mutation, error, empty, and confirmation behaviors remain available.
4. Reviews and other personal resource data are loaded on demand rather than unconditionally by the Profile shell.
5. Overview links use existing protected routes and do not require a new backend endpoint.
6. Personal info and password forms communicate dirty, saving, success, and error states without losing user input.
7. Primary actions are labeled, keyboard accessible, and usable on mobile.
8. Profile does not introduce fabricated statistics, unsupported account claims, avatar storage, or unrelated route changes.
9. Focused tests cover navigation, forms, loading/error/empty states, and responsive behavior.
10. Frontend typecheck, lint, unit tests, and build pass, or any environment-only blocker is reported with the exact command and stage.

## Rollback and future extension

The redesign is bounded to `src/frontend/features/profile` and focused profile tests. The default Overview can be reverted independently while preserving the existing content components and API routes.

If usage data later shows that users need activity counts, add an authenticated `/users/me/summary` contract and load it only for Overview. That extension must use authoritative server data and must not make Profile responsible for rendering full versions of saved recipes, planning, pantry, shopping, or cooking history.
