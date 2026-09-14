# Frontend Accessibility Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Home carousel accessible and add automated accessibility regression coverage to the existing frontend quality gates.

**Architecture:** Keep the existing React carousel and Playwright stack. Accessibility state is derived in `Carousel.jsx` and passed to each slide; inactive slides remain in the animation track but are removed from the accessibility/focus tree. Playwright uses axe for page-level WCAG checks while focused unit tests protect carousel semantics.

**Tech Stack:** React 19, Vitest/react-test-renderer, Playwright, `@axe-core/playwright`, SCSS.

**Spec:** `docs/superpowers/specs/2026-08-24-frontend-accessibility-css-audit-design.md`

## Global Constraints

- Preserve the existing visual identity and routing behavior.
- Carousel slide headings are `h2`; the Home page keeps its existing page-level `h1`.
- Inactive slides are both `aria-hidden` and `inert`.
- Automatic motion is disabled for `prefers-reduced-motion` and paused on hover/focus.
- Carousel controls have at least a 44x44 CSS-pixel hit target and visible `:focus-visible` treatment.
- New E2E accessibility checks fail on serious/critical axe violations.

---

### Task 1: Lock carousel semantics with failing tests

**Files:**
- Create: `src/frontend/features/home/Carousel.accessibility.test.jsx`
- Modify later: `src/frontend/features/home/Carousel.jsx`
- Modify later: `src/frontend/features/home/carousel/CarouselItem.jsx`

**Interfaces:**
- Consumes: `Carousel({ items })`.
- Produces: active slide semantic contract (`aria-hidden`, `inert`, `h2`).

- [ ] **Step 1: Write failing tests** that render two carousel items inside `MemoryRouter` and assert only the active slide is exposed, inactive slide is inert, and slide titles are `h2`.
- [ ] **Step 2: Run** `pnpm vitest run features/home/Carousel.accessibility.test.jsx` and verify the semantic assertions fail against the current carousel.
- [ ] **Step 3: Implement minimal semantics** by passing `isActive` to `CarouselItem`, setting `aria-hidden={!isActive}` and `inert={!isActive ? "" : undefined}`, and changing slide `h1` to `h2`.
- [ ] **Step 4: Re-run the focused test** and verify PASS.
- [ ] **Step 5: Commit** with `fix(a11y): isolate inactive carousel slides`.

### Task 2: Harden carousel motion and controls

**Files:**
- Modify: `src/frontend/features/home/Carousel.jsx`
- Modify: `src/frontend/features/home/carousel/CarouselNavBar.jsx`
- Modify: `src/frontend/features/home/Home.scss`
- Extend test: `src/frontend/features/home/Carousel.accessibility.test.jsx`

**Interfaces:**
- Consumes: browser `matchMedia('(prefers-reduced-motion: reduce)')`, focus/hover events.
- Produces: rotation gate `canAutoRotate`; labelled carousel region; 44px control styles.

- [ ] **Step 1: Add failing tests** for pause-on-focus and reduced-motion behavior by stubbing `window.matchMedia` and fake timers.
- [ ] **Step 2: Run focused tests** and confirm failure is due to current unconditional interval behavior.
- [ ] **Step 3: Implement** separate explicit pause, pointer pause, focus-within pause, reduced-motion state, and derive auto-rotation eligibility. Add `role="region"`, `aria-roledescription="carousel"`, and `aria-label="Featured meals"` to the root.
- [ ] **Step 4: Update SCSS** to use percentage-based slide widths/translation, 44px controls, focus-visible outlines, and a reduced-motion media query that removes non-essential transforms/transitions.
- [ ] **Step 5: Run focused tests and `pnpm check`**; verify PASS.
- [ ] **Step 6: Commit** with `fix(a11y): respect carousel motion preferences`.

### Task 3: Add automated page accessibility checks

**Files:**
- Modify: `src/frontend/package.json`
- Modify: `src/frontend/pnpm-lock.yaml`
- Create: `src/frontend/e2e/accessibility.spec.js`

**Interfaces:**
- Consumes: existing Playwright webServer and route fixtures.
- Produces: axe scan helper and horizontal-overflow assertion for critical routes.

- [ ] **Step 1: Add `@axe-core/playwright` as a dev dependency** and update the lockfile.
- [ ] **Step 2: Create E2E tests** for `/`, `/food`, `/about`, `/news`, and route surfaces that can be reached reliably with existing mocked/local test data. Configure axe to report WCAG 2 A/AA and fail on serious/critical violations.
- [ ] **Step 3: Add a horizontal-overflow assertion** using `document.documentElement.scrollWidth <= document.documentElement.clientWidth` for the same public pages.
- [ ] **Step 4: Run** `pnpm test:e2e:ci` and fix only violations introduced or exposed by this accessibility foundation; route-specific product changes stay out of scope.
- [ ] **Step 5: Run** `pnpm check && pnpm build && pnpm test:e2e:ci`.
- [ ] **Step 6: Commit** with `test(a11y): add automated accessibility checks`.

### Task 4: Review and PR verification

**Files:**
- No production files unless verification exposes a regression.

- [ ] **Step 1: Review diff** for unrelated visual/product changes.
- [ ] **Step 2: Confirm** current quality gates use frozen lockfile install and Playwright E2E.
- [ ] **Step 3: Open PR** titled `fix(a11y): harden carousel and accessibility automation`.
- [ ] **Step 4: Verify GitHub Actions** static, backend, frontend, frontend-e2e and docker jobs are green before declaring completion.
