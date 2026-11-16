# Food Recipes — Product-wide UX quality plan

**Reviewed:** 2026-11-15  
**Basis:** `src/frontend/app/AppRoutes.tsx`, `docs/frontend/current-user-journeys.md`, `src/frontend/features/**`, existing Playwright quality and kitchen-loop tests.  
**Status:** Implementation and local acceptance coverage are complete for the listed waves on PR #206. Deployment remains pending until the updated PR passes required CI, the preview is reviewed, and the merged production revision passes a read-only smoke check. Evidence and limits are recorded below.

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
- [x] PostgreSQL real-stack retry/concurrency behavior: two tabs preparing the same meal produce one shopping row; replaying completion after a lost response produces one history row and one pantry deduction. This tests duplicate/retry safety, not simultaneous pantry edits. The same suite runs in the isolated PostgreSQL CI job.

### Wave 2 — Global navigation and continuity (partially implemented)
Surfaces: Header/mobile drawer, Home, Discover, Recipe details, Saved, Profile.
- Keep active navigation state and distinguish personal versus household scope consistently.
- Maintain search/filter state on back navigation and after authentication.
- Desktop “More” and account navigation now follow disclosure semantics for ordinary links, close on route changes, and return focus on Escape. The mobile drawer traps focus, closes on Escape/navigation, locks body scroll, and restores focus; the household scope selector waits for loaded household data to avoid a transient 320px overflow.
- Validate guest save/return intent and unauthorized/expired-session recovery.
- [x] Guest save/return, protected-route and expired-session recovery journeys pass in the deterministic browser suite. Session expiry is fixture-driven, not a live provider/session revocation test.
- [x] Discover filters use URL state and protected routes retain the requested destination. A PostgreSQL-backed matrix visits all 22 authenticated product routes at 320, 375, 390, 720, 768, 1024 and 1440 CSS pixels, checks horizontal overflow and axe WCAG 2.0/2.1/2.2 A/AA, captures 46 screenshots, and asserts route review caused no writes except the expected cooking-session start. Screenshot sheets were reviewed manually.

### Wave 3 — Planning and cooking (partially implemented)
Surfaces: Planning grid/agenda, meal dialogs, recipe editor, cooking sessions, leftovers.
- Planning week selection is now mirrored in `?week=YYYY-MM-DD`, follows browser back/forward, and carries into Shopping List and its return links; invalid calendar dates are rejected.
- Existing planning UI provides calendar and agenda views, keyboard-operable drag-and-drop, edit dialogs, and loading/empty/error states. The mobile agenda now has a Playwright journey that changes a meal's date and slot through the keyboard-operable edit action, without relying on drag-and-drop.
- [x] Validate the mobile agenda and its keyboard-operable edit alternative to drag-and-drop.
- [x] Verify keyboard-only drag into an empty slot and rejection/announcement for an occupied slot in Playwright; mobile agenda editing also works through keyboard-operable controls.
- [x] Confirm cooking interruption/resume, retry after shortages and handoff to history in deterministic journeys.
- [x] Test both leftover completion paths before review/history: Skip and Save leftover.
- [x] Preserve unsaved recipe editor values on validation/API failures and warn before discarding recipe/profile edits or leaving the page; component tests cover confirm/cancel and `beforeunload` behavior.

### Wave 4 — Pantry, household and account UX (partially implemented)
Surfaces: Pantry, Households/invites, History, Journal, Preferences, Notifications, Account recovery.
- Normalize ingredient units and validation help, avoid inventory-state ambiguities.
- Make membership/role actions explicit and prevent accidental edits by viewers.
- Handle empty search, pagination, expired invitations, save errors, permission denial and session expiry.
- Ensure readable helper text, focus states, dialog labels and error announcements.
- Existing code includes VIEWER read-only states on pantry/shopping/planning, explicit household role checks in the UI, labeled recovery flows, and retry/error states on several routes. The full route/role/error matrix is not yet verified.
- [x] Verify the use-soon pantry path through recipe search, ingredient preparation and meal planning. PostgreSQL role/security coverage verifies OWNER, MEMBER, VIEWER and non-member behavior, including read-only and duplicate-write boundaries.
- [x] Route-level accessibility/overflow review covers the authenticated product routes above. Mock journeys additionally exercise empty, retryable error, validation, guest and permission-denied states on the relevant routes; this is journey-level state coverage, not every possible state combination on every URL.

### Wave 5 — UI design system and release QA (partially implemented)
- Consolidate repeated page headers, button variants, form labels, status/skeleton/error components without replacing established branding.
- [x] Existing shared primitives include Button, Input, PageState, focus-visible tokens and reduced-motion handling. Axe WCAG 2.0/2.1/2.2 A/AA ran on every route at every viewport, including applicable contrast and WCAG 2.2 target-size checks; 720 CSS px is the 200% reflow equivalent of 1440 CSS px. The 720px check is viewport reflow coverage, not a browser zoom-control test. The product's preferred 44px touch size is not a universal rule for every desktop control.
- [x] Deterministic Playwright coverage includes 320, 375, 390, 720, 768, 1024 and 1440px. The PostgreSQL-backed route matrix captured 46 screenshots; full route contact sheets and Home/Households at 320px were visually reviewed. Existing Discover/weekly-shopping snapshot baselines remain in place.
- [x] Manually inspect visual diffs and run production-adjacent PostgreSQL checks before release: route screenshots reviewed; real-stack suite passed all 15 tests, including same-meal concurrent prepare, completion retry, inventory, role/security and route accessibility checks.

### Implementation evidence (2026-11-16)
- `planningDates.parseIsoDate` rejects malformed and overflow calendar dates; focused unit coverage was added.
- Desktop “More” and account disclosures no longer advertise ARIA menu patterns while exposing ordinary links; they close after route changes and Escape restores focus to their triggers. Playwright covers both desktop disclosures' Escape and route closure, the mobile drawer's Escape, route closure, scroll lock and focus return, plus the Discover viewport matrix and screenshot baselines for Discover and weekly shopping.
- Planning week query state is shared with Shopping List and survives browser history navigation; focused link and date tests were added.
- Cooking completion now explains that Save leftover or Skip must be resolved before returning to the recipe/history; Playwright covers saving and skipping. Mobile planning agenda coverage verifies date/slot edits using keyboard-operable controls. A stale planning E2E fixture now maps API `date` back to `planned_date` correctly.
- The frontend Quality Gates job now runs the complete deterministic `pnpm test:e2e:ci` suite instead of only its 12-test subset. Linux screenshot baselines use images produced by the failed CI run; Windows snapshots were refreshed from the current page output.
- The route acceptance matrix is complete for the route/viewport/axe/screenshot checks described above. It does not claim that every empty/loading/error state was repeated at every viewport, nor that fixture-driven session expiry represents live provider revocation. Browser zoom controls were not changed; 720 CSS px validates equivalent desktop reflow.
- Verification (local, 2026-11-16): CI-mode `pnpm test:e2e:ci` passed all 82 deterministic journeys; `pnpm check` passed (139 files, 467 tests), and `pnpm build` passed with the workflow API base URL. Backend `pnpm check` passed (67 suites, 350 tests), Prisma validation and API E2E passed (14 passed, 8 skipped), and backend build passed. The PostgreSQL-backed browser suite passed all 15 tests; the 22-route matrix passed at seven viewport widths with axe scans at each. Vercel preview shell review succeeded, but feature-branch preview requests to the live Railway API fail CORS; the production frontend origin passes the API preflight. The Railway allowlist was not changed. GitHub CI and post-merge production smoke remain pending on the final pushed revision. Local browser evidence does not claim production behavior.

## Definition of done per route

- [x] Behavior: route smoke plus relevant empty, loading, retryable error, permission, and authenticated/guest journeys.
- [x] Visual: 320, 375, 390, 720, 768, 1024 and 1440 CSS px, no unintended horizontal scrolling, route screenshots reviewed.
- [x] Keyboard: visible focus and tested logical keyboard paths, including Escape/drawer/dialog and planning drag/edit behavior.
- [x] Accessibility: semantic labels/landmarks and WCAG 2.0/2.1/2.2 A/AA axe scan per route and viewport, including applicable contrast and WCAG 2.2 target-size checks. The 720px viewport verifies 200% reflow equivalence; the browser zoom control itself was not changed. The product's preferred 44px touch size is not applied as a universal minimum to desktop controls.
- [x] State: filters/week/scope are preserved in relevant journeys; route review asserts no unintended API writes.
- [x] Testing: Vitest/Jest, all 82 Playwright mock journeys, and 15 PostgreSQL-backed real-stack tests pass locally.
- [ ] Deployment: PR checks pass, preview review, then safe release and production smoke check.

## Evidence boundary

Quality Gates run the deterministic frontend browser suite, backend tests, and a separate PostgreSQL-backed real-stack suite. The route matrix evidence above is local and production-adjacent. Deployment DoD remains open until the pushed PR revision has green required checks, its Vercel preview and API integration are reviewed, it is merged, and the production revision is smoke-tested. The current branch preview hostname is outside the Railway API CORS allowlist; only add that exact origin if the owner authorizes the production access-policy change.
