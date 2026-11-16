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

### Wave 2 — Global navigation and continuity (partially implemented)
Surfaces: Header/mobile drawer, Home, Discover, Recipe details, Saved, Profile.
- Keep active navigation state and distinguish personal versus household scope consistently.
- Maintain search/filter state on back navigation and after authentication.
- Desktop “More” and account navigation now follow disclosure semantics for ordinary links, close on route changes, and return focus on Escape. The mobile drawer traps focus, closes on Escape/navigation, locks body scroll, and restores focus; the household scope selector waits for loaded household data to avoid a transient 320px overflow.
- Validate guest save/return intent and unauthorized/expired-session recovery.
- Guest save/return and protected-route journeys are now included in the deterministic browser suite; session-expiry coverage is still tracked separately from a live authenticated session.
- Existing Discover filters use URL state and protected routes retain the requested destination through sign-in. Full route-by-route viewport screenshots and axe-core coverage remain outstanding.

### Wave 3 — Planning and cooking (partially implemented)
Surfaces: Planning grid/agenda, meal dialogs, recipe editor, cooking sessions, leftovers.
- Planning week selection is now mirrored in `?week=YYYY-MM-DD`, follows browser back/forward, and carries into Shopping List and its return links; invalid calendar dates are rejected.
- Existing planning UI provides calendar and agenda views, keyboard-operable drag-and-drop, edit dialogs, and loading/empty/error states. The mobile agenda now has a Playwright journey that changes a meal's date and slot through the keyboard-operable edit action, without relying on drag-and-drop.
- [x] Validate the mobile agenda and its keyboard-operable edit alternative to drag-and-drop.
- [ ] Verify keyboard-only drag behavior and occupied-slot conflicts end-to-end.
- [x] Confirm cooking interruption/resume, retry after shortages and handoff to history in deterministic journeys.
- [x] Test both leftover completion paths before review/history: Skip and Save leftover.
- Preserve unsaved form state on validation/API failures; warn before discarding edits.

### Wave 4 — Pantry, household and account UX (partially implemented)
Surfaces: Pantry, Households/invites, History, Journal, Preferences, Notifications, Account recovery.
- Normalize ingredient units and validation help, avoid inventory-state ambiguities.
- Make membership/role actions explicit and prevent accidental edits by viewers.
- Handle empty search, pagination, expired invitations, save errors, permission denial and session expiry.
- Ensure readable helper text, focus states, dialog labels and error announcements.
- Existing code includes VIEWER read-only states on pantry/shopping/planning, explicit household role checks in the UI, labeled recovery flows, and retry/error states on several routes. The full route/role/error matrix is not yet verified.
- [x] Verify the use-soon pantry path through recipe search, ingredient preparation and meal planning; broader expiry and household role matrices remain open.

### Wave 5 — UI design system and release QA (partially implemented)
- Consolidate repeated page headers, button variants, form labels, status/skeleton/error components without replacing established branding.
- Existing shared primitives include Button, Input, PageState, focus-visible tokens, and reduced-motion handling. Contrast across interaction states and 200% zoom remain unaudited.
- Deterministic Playwright fixtures and a Discover overflow matrix at 320, 375, 390, 768, 1024, and 1440px exist. Screenshot baselines cover Discover at 390px and weekly shopping at 390px and 1440px on Windows and Linux; baselines for other critical routes and the full route-by-route matrix remain outstanding.
- Inspect visual diffs manually and run production-adjacent real-stack tests before release.

### Implementation evidence (2026-11-16)
- `planningDates.parseIsoDate` rejects malformed and overflow calendar dates; focused unit coverage was added.
- Desktop “More” and account disclosures no longer advertise ARIA menu patterns while exposing ordinary links; they close after route changes and Escape restores focus to their triggers. Playwright covers both desktop disclosures' Escape and route closure, the mobile drawer's Escape, route closure, scroll lock and focus return, plus the Discover viewport matrix and screenshot baselines for Discover and weekly shopping.
- Planning week query state is shared with Shopping List and survives browser history navigation; focused link and date tests were added.
- Cooking completion now explains that Save leftover or Skip must be resolved before returning to the recipe/history; Playwright covers saving and skipping. Mobile planning agenda coverage verifies date/slot edits using keyboard-operable controls. A stale planning E2E fixture now maps API `date` back to `planned_date` correctly.
- The frontend Quality Gates job now runs the complete deterministic `pnpm test:e2e:ci` suite instead of only its 12-test subset. Linux screenshot baselines use images produced by the failed CI run; Windows snapshots were refreshed from the current page output.
- These changes do not certify every route in the waves. Screenshot review on remaining routes, full axe coverage, 200% zoom, unsaved-edit discard warnings, and production-adjacent PostgreSQL checks remain release QA work.
- Verification (local, 2026-11-16): CI-mode `pnpm test:e2e:ci` passed all 79 deterministic journeys; `pnpm build` passed with the same `VITE_API_BASE_URL` as the workflow; application-TypeScript check, ESLint, TypeScript and Vitest passed (139 files, 460 tests). The aggregate `pnpm check` wrapper did not run in this Windows shell because a nested `pnpm` resolved to 11.20.0 instead of the package's 11.18.0; its child gates passed individually. GitHub CI must still confirm the pushed revision. Results are mock-stack evidence, not production/database or full-route visual QA.

## Definition of done per route

- [ ] Behavior: normal, empty, loading, retryable error, permission, authenticated/guest flows.
- [ ] Visual: 320, 375, 390, 768, 1024 and 1440px, no unintended horizontal scrolling.
- [ ] Keyboard: visible focus, logical order, Escape/drawer/dialog behavior.
- [ ] Accessibility: semantic labels and landmarks, WCAG/axe scan, contrast and target checks.
- [ ] State: no lost filters or week/scope selections, no accidental writes.
- [ ] Testing: Vitest/Jest, Playwright mock journeys, and real-stack tests for server contracts.
- [ ] Deployment: PR checks pass, preview review, then safe release and production smoke check.

## Evidence boundary

Quality Gates run the deterministic frontend browser suite, including discovery, auth, planning, pantry, shopping and cooking journeys. `test:e2e:real` remains a separate PostgreSQL-backed check. The remaining visual and accessibility route matrix and production QA are not certified by the deterministic suite; do not mark later waves complete until that evidence exists.
