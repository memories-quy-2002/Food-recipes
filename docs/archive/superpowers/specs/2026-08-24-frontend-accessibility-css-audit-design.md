# Frontend Accessibility and CSS Audit Design

## Goal

Harden the Food Recipes frontend for keyboard and assistive-technology users, add automated WCAG regression coverage, and audit the entire site CSS/SCSS for responsive behavior, interaction states, spacing, typography, overflow, tap-target sizing, motion preferences, and maintainability without redesigning the existing visual identity.

## Scope

The work is split into two reviewable PRs.

1. **Accessibility foundation**
   - Make the Home carousel expose only the active slide to assistive technology and keyboard focus.
   - Preserve one page-level `h1`; carousel slide titles use `h2`.
   - Pause automatic movement while the carousel has pointer hover or keyboard focus.
   - Respect `prefers-reduced-motion`.
   - Ensure carousel controls meet a 44x44 CSS-pixel minimum target and have visible `:focus-visible` states.
   - Add automated accessibility coverage to the existing Playwright suite.

2. **Whole-site CSS/SCSS audit**
   - Review all frontend global CSS, component SCSS and route-level styles.
   - Remove avoidable horizontal overflow and brittle viewport sizing.
   - Normalize focus-visible, active, disabled and hover states where controls are interactive.
   - Enforce practical 44px minimum targets for primary interactive controls.
   - Improve responsive behavior at mobile, tablet and desktop widths without changing product layout intent.
   - Respect reduced-motion across non-essential transitions and animations.
   - Reduce high-specificity/redundant rules when safely possible.
   - Retain fallbacks for modern visual effects such as `backdrop-filter`.

## Accessibility behavior

### Carousel

The carousel root is a labelled region. Each slide keeps its DOM position for animation, but inactive slides are `aria-hidden` and `inert`; the active slide is neither. Navigation buttons remain outside hidden slides. Slide changes initiated by the user remain discoverable through the labelled controls without using an assertive live region.

Automatic rotation runs only when all of the following are true: more than one slide exists, the user has not explicitly paused, the carousel is not hovered, the carousel does not contain keyboard focus, and the user does not request reduced motion.

### Automated checks

Playwright will run `@axe-core/playwright` against critical public pages and fail on serious/critical accessibility violations. Route-specific E2E tests continue to cover keyboard behavior and semantic contracts that axe cannot guarantee. A viewport regression assertion checks that critical pages do not introduce horizontal page scrolling.

## CSS audit rules

- Keep `box-sizing: border-box` globally.
- Prefer container-relative sizing (`width: 100%`, grid fractions, `min()`/`max()`/`clamp()`) over `100vw` inside page containers.
- Use `rem`/`em`/`clamp()` for typography and scalable spacing where appropriate; retain pixel values when they represent borders, icons, breakpoints or exact touch-target constraints.
- Avoid transitions on layout-heavy properties when transform/opacity can express the effect.
- Never remove visible keyboard focus.
- Interactive target minimum is 44x44 CSS pixels where feasible; text links embedded in prose are exempt.
- Long content must wrap or truncate deliberately without breaking the layout.
- Mobile baseline is 375px, tablet checks include 768px and 1024px, desktop checks include 1440px.
- Keep existing colors, Nunito typography and warm Food Recipes visual identity unless a contrast violation requires a token-level adjustment.

## Verification

Each PR must pass the repository's existing `pnpm check`, frontend build and Playwright E2E quality gates. Accessibility PR additionally runs axe scans. CSS PR additionally checks critical routes at multiple viewport widths for horizontal overflow and interaction regressions.
