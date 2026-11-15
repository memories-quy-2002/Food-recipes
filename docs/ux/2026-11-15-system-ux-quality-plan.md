# Food Recipes — Product-wide UX quality plan

**Reviewed:** 2026-11-15  
**Basis:** `src/frontend/app/AppRoutes.tsx`, `docs/frontend/current-user-journeys.md`, `src/frontend/features/**`, existing Playwright quality and kitchen-loop tests.  
**Status:** Implementation is **partial**. This document is a prioritized acceptance matrix, not a claim of visual QA on every screen.

## Product principles

1. Continue the user's current task: Discover → Save → Plan → Shop → Pantry → Cook → History.
2. Preserve selection across navigation (scope, selected week, filter query, recipe).
3. Show what will change before destructive or bulk mutations. Keep manual data intact.
4. Use one clear primary CTA per task region, plus accessible cancel/retry paths.
5. Respect guest, authenticated, OWNER/MEMBER/VIEWER and explicit empty/loading/error states.
6. Support keyboard navigation, reduced motion, 320–1440px viewports, 44px touch controls, WCAG 2.2 AA where practical.
7. Make real functional outcomes observable; passing mocked tests is not proof of Railway or PostgreSQL correctness.

## Delivery waves

### Wave 1 — Weekly kitchen loop (PR #206: implemented)
- [x] Dedicated responsive weekly shopping review rather than embedding it in the manual-add form.
- [x] Ingredient table with required / in pantry / to buy and mobile-stacked cells; table headers remain accessible.
- [x] Show incomplete-preview warning and require explicit acknowledgement before confirming a partial list.
- [x] Household VIEWER may preview but never confirm; backend already enforces role boundaries.
- [x] Preserve selected week when navigating Planner → Shopping List using `?week=YYYY-MM-DD`.
- [x] Handle loading, missing plan, API error/retry and no-new-items states.
- [x] Component tests + Playwright responsive, permissions, consent, duplicate and week-navigation journeys.
- [ ] Real-stack PostgreSQL / Railway behavior with concurrent pantry edits must be checked separately.

### Wave 2 — Global navigation and continuity (not yet implemented)
Surfaces: Header/mobile drawer, Home, Discover, Recipe details, Saved, Profile.
- Keep active navigation state and distinguish personal versus household scope consistently.
- Maintain search/filter state on back navigation and after authentication.
- Validate dropdown/drawer keyboard trap, focus return, Escape handling, background scroll lock and route-change closure.
- Validate guest save/return intent and unauthorized/expired-session recovery.
- Test mobile 320/375/390/768 and desktop 1024/1440; use screenshots and axe-core.

### Wave 3 — Planning and cooking (not yet implemented)
Surfaces: Planning grid/agenda, meal dialogs, recipe editor, cooking sessions, leftovers.
- Make week navigation and cross-page selection consistent, with meaningful loading/empty/error states.
- Verify keyboard alternatives to drag-and-drop, conflict resolution and mobile agenda.
- Confirm cooking timers, interruption/resume, retry after shortages and handoff to history.
- Preserve unsaved form state on validation/API failures; warn before discarding edits.

### Wave 4 — Pantry, household and account UX (not yet implemented)
Surfaces: Pantry, Households/invites, History, Journal, Preferences, Notifications, Account recovery.
- Normalize ingredient units and validation help, avoid inventory-state ambiguities.
- Make membership/role actions explicit and prevent accidental edits by viewers.
- Handle empty search, pagination, expired invitations, save errors, permission denial and session expiry.
- Ensure readable helper text, focus states, dialog labels and error announcements.

### Wave 5 — UI design system and release QA (not yet implemented)
- Consolidate repeated page headers, button variants, form labels, status/skeleton/error components without replacing established branding.
- Audit contrast across default/hover/disabled states, viewport zoom at 200%, color-reliant statuses, and reduced-motion.
- Establish screenshot baselines for critical journeys, use named viewport matrix and maintain deterministic Playwright fixtures.
- Inspect visual diffs manually and run production-adjacent real-stack tests before release.

## Definition of done per route

- [ ] Behavior: normal, empty, loading, retryable error, permission, authenticated/guest flows.
- [ ] Visual: 320, 375, 390, 768, 1024 and 1440px, no unintended horizontal scrolling.
- [ ] Keyboard: visible focus, logical order, Escape/drawer/dialog behavior.
- [ ] Accessibility: semantic labels and landmarks, WCAG/axe scan, contrast and target checks.
- [ ] State: no lost filters or week/scope selections, no accidental writes.
- [ ] Testing: Vitest/Jest, Playwright mock journeys, and real-stack tests for server contracts.
- [ ] Deployment: PR checks pass, preview review, then safe release and production smoke check.

## Evidence boundary

Quality Gates currently contain targeted `frontend-quality.spec.js` and `kitchen-loop.spec.js`. Wave 1 adds `weekly-shopping-ux.spec.js`; the remaining route matrix is not certified by those tests. Do not mark later waves complete until actual code changes and browser evidence exist.
