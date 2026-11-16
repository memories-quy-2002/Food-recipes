# Food Recipes — Product-wide UX quality plan

**Reviewed:** 2026-11-16
**Basis:** `src/frontend/app/AppRoutes.tsx`, `docs/frontend/current-user-journeys.md`, `src/frontend/features/**`, existing Playwright quality and kitchen-loop tests.  
**Status:** PR #206 is merged to `master` as `745c9530`. Required CI and the Vercel preview are green/reviewed. The resulting Vercel production deployment is READY for that exact merge SHA, and a read-only Playwright smoke check passed on the production alias. The branch preview cannot call the production Railway API because its origin is outside the CORS allowlist; the isolated PostgreSQL browser suite verifies the real API integration without changing production policy.

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
- Existing code includes VIEWER read-only states on pantry/shopping/planning, explicit household role checks in the UI, labeled recovery flows, and retry/error states on several routes. CI now verifies the authenticated route/role matrix; mock journeys cover relevant empty, retry, validation, guest, and permission-denied states without claiming every state on every route.
- [x] Verify the use-soon pantry path through recipe search, ingredient preparation and meal planning. PostgreSQL role/security coverage verifies OWNER, MEMBER, VIEWER and non-member behavior, including read-only and duplicate-write boundaries.
- [x] Route-level accessibility/overflow review covers the authenticated product routes above. Mock journeys additionally exercise empty, retryable error, validation, guest and permission-denied states on the relevant routes; this is journey-level state coverage, not every possible state combination on every URL.

### Wave 5 — UI design system and release QA (partially implemented)
- Consolidate repeated page headers, button variants, form labels, status/skeleton/error components without replacing established branding.
- [x] Existing shared primitives include Button, Input, PageState, focus-visible tokens and reduced-motion handling. Axe WCAG 2.0/2.1/2.2 A/AA ran on every route at every viewport, including applicable contrast and WCAG 2.2 target-size checks; 720 CSS px is the 200% reflow equivalent of 1440 CSS px. The 720px check is viewport reflow coverage, not a browser zoom-control test. The product's preferred 44px touch size is not a universal rule for every desktop control.
- [x] Deterministic Playwright coverage includes 320, 375, 390, 720, 768, 1024 and 1440px. The PostgreSQL-backed route matrix captured 46 screenshots; the full route contact sheets and Home/Households at 320px were visually reviewed. On the final responsive fixes, Profile, Planning, Pantry, and Journal screenshots at 390px and 1440px were reviewed. Existing Discover/weekly-shopping snapshot baselines remain in place.
- [x] Manually inspect visual diffs and run production-adjacent PostgreSQL checks before release: final responsive screenshots reviewed; CI real-stack suite passed all 15 tests, including same-meal concurrent prepare, completion retry, inventory, role/security and route accessibility checks.

### Implementation evidence (2026-11-16)
- `planningDates.parseIsoDate` rejects malformed and overflow calendar dates; focused unit coverage was added.
- Desktop “More” and account disclosures no longer advertise ARIA menu patterns while exposing ordinary links; they close after route changes and Escape restores focus to their triggers. Playwright covers both desktop disclosures' Escape and route closure, the mobile drawer's Escape, route closure, scroll lock and focus return, plus the Discover viewport matrix and screenshot baselines for Discover and weekly shopping.
- Planning week query state is shared with Shopping List and survives browser history navigation; focused link and date tests were added.
- Cooking completion now explains that Save leftover or Skip must be resolved before returning to the recipe/history; Playwright covers saving and skipping. Mobile planning agenda coverage verifies date/slot edits using keyboard-operable controls. A stale planning E2E fixture now maps API `date` back to `planned_date` correctly.
- The frontend Quality Gates job now runs the complete deterministic `pnpm test:e2e:ci` suite instead of only its 12-test subset. Linux screenshot baselines use images produced by the failed CI run; Windows snapshots were refreshed from the current page output.
- The route acceptance matrix is complete for the route/viewport/axe/screenshot checks described above. It does not claim that every empty/loading/error state was repeated at every viewport, nor that fixture-driven session expiry represents live provider revocation. Browser zoom controls were not changed; 720 CSS px validates equivalent desktop reflow.
- Verification (2026-11-16): GitHub Quality Gates run [43843102033](https://github.com/memories-quy-2002/Food-recipes/actions/runs/43843102033) passed on `63aedc6`: frontend check/build, 83 deterministic Playwright journeys, backend checks (67 suites / 350 tests), API E2E (14 passed / 8 skipped), production image build, and all 15 PostgreSQL real-stack journeys. The real-stack route matrix passed 22 authenticated routes × seven widths with axe WCAG 2.0/2.1/2.2 A/AA at every route/width, no horizontal overflow, and no unplanned API mutations. Focused local tests passed for JournalForm (2), PlanningPage (2), and PantryPage (7). Vercel preview was READY and its UI shell was reviewed. PR #206 was merged to `master` as `745c9530f270b4afc2a1d197177ba118b2c367a1`; Vercel production deployment `dpl_8ADm4vULfUXnw8QZa4W2WoxTXHxc` is READY for that exact SHA and serves `foodrecipes1.vercel.app`. Playwright CLI smoke on the production alias verified Home, the 20-recipe library, and Banana Oat Pancakes; production API calls for home feed, categories, meals, recipe 14, and its reviews returned HTTP 200. The sole console error was the anonymous `POST /api/v1/auth/refresh` returning 401, consistent with the signed-out smoke session; no warnings were recorded. Requests from the branch preview origin to the production Railway API fail CORS, while the production frontend origin passes API preflight. The Railway allowlist was not changed. These production observations cover a read-only smoke only; authenticated and write flows are covered by the isolated PostgreSQL CI suite, not claimed as production-tested.

## Definition of done per route

- [x] Behavior: route smoke plus relevant empty, loading, retryable error, permission, and authenticated/guest journeys.
- [x] Visual: 320, 375, 390, 720, 768, 1024 and 1440 CSS px, no unintended horizontal scrolling; final screenshots for the touched responsive routes were reviewed alongside the route sheets.
- [x] Keyboard: visible focus and tested logical keyboard paths, including Escape/drawer/dialog and planning drag/edit behavior.
- [x] Accessibility: semantic labels/landmarks and WCAG 2.0/2.1/2.2 A/AA axe scan per route and viewport, including applicable contrast and WCAG 2.2 target-size checks. The 720px viewport verifies 200% reflow equivalence; the browser zoom control itself was not changed. The product's preferred 44px touch size is not applied as a universal minimum to desktop controls.
- [x] State: filters/week/scope are preserved in relevant journeys; route review asserts no unintended API writes.
- [x] Testing: Vitest/Jest, all 83 Playwright mock journeys, and 15 PostgreSQL-backed real-stack tests pass in CI; the relevant full checks also pass locally.
- [x] Deployment: PR checks passed, preview reviewed, PR #206 merged safely, and the resulting production revision passed a read-only route/API smoke check. Authenticated and write flows remain covered by isolated PostgreSQL CI rather than production mutations.

## Evidence boundary

Quality Gates run the deterministic frontend browser suite, backend tests, and a separate PostgreSQL-backed real-stack suite. The final route matrix and API integration evidence is on GitHub CI run 43843102033; the Vercel preview UI is separately reviewed. Deployment DoD passed after PR #206 merged and the exact merge-SHA production deployment passed a read-only smoke check. The branch preview hostname is outside the Railway API CORS allowlist; no production policy change was made. Add that exact origin only with explicit owner authorization. The signed-out smoke's refresh endpoint returning 401 is expected and does not establish authenticated production behavior.
