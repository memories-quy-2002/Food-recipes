# Recipe Detail and Mobile Discovery UX Design

## Scope

Phase 4 improves the recipe detail page around the decision to cook: title and metadata remain prominent, time and servings become a compact scan row near the hero, and long-form content is constrained for comfortable reading.

Phase 5 improves `/food` on phones without changing the existing API or URL contract. The desktop sidebar remains the large-screen filter surface. Mobile gets a filter button and bottom sheet, while active filter chips and sort stay visible in the page flow.

## Design direction

Keep the approved Food Recipes visual language: dark coffee, cream, citrus orange, restrained radius, editorial type scale, and strong focus rings. The distinctive element is a compact "decision strip": time and serving facts are treated as practical cooking signals rather than decorative cards.

The UI/UX search reinforced these constraints: mobile controls are at least 44px, adjacent targets have at least 8px spacing, filter state is deep-linkable, hover is never the only interaction, and reduced motion is respected. The generic vibrant/block recommendation was rejected because it would break the existing recipe brand.

## Phase 4 behavior

- Recipe summary keeps title, rating/review count, author, category/meal/difficulty, image, and the action group near the top.
- Prep, Cook, Total, and Servings are rendered before About in a compact responsive decision strip.
- About, Ingredients, Instructions, and Community Reviews remain separate sections.
- Text-heavy sections use a readable measure (`min(100%, 68ch)`) without clipping ingredient or instruction content.
- Mobile actions remain sticky and full-width, with safe-area padding and visible focus.

## Phase 5 behavior

- Existing query keys remain canonical: `q`, `categoryId`, `mealId`, `sort`, `page`, and `limit`.
- Desktop continues to render the sidebar.
- At mobile widths, a `Filters (n)` button opens a bottom sheet containing search, category, meal, and Clear all.
- Applying a filter updates the URL through the existing `onQueryStateChange` path and closes the sheet only when the user explicitly applies or selects a filter; the sheet can also be dismissed with Escape or Cancel.
- Active filters are removable chips. Search is represented as `Search: <term>`, category and meal use their loaded labels, and `Clear all` removes all filter keys while preserving the default sort/page/limit behavior.
- Sort remains a labeled control in the results toolbar and is independently URL-driven.
- The browser back/forward path is covered with a Playwright journey; no local mirror of filter state is introduced.

## Error, loading, and accessibility behavior

- Existing loading, error, empty, and fetching states remain visible in the results region.
- The drawer uses `role="dialog"`, `aria-modal`, an accessible name, Escape handling, and a visible close/cancel action.
- Buttons and form controls are at least 44px high; focus-visible outlines remain visible.
- The sheet prevents page interaction while open and does not rely on hover.
- Reduced motion disables sheet and recipe-detail transitions.

## Testing strategy

- Unit/component tests cover recipe time ordering, constrained reading classes, filter count/chip labels, clear-all behavior, drawer open/close, and URL callback payloads.
- Playwright covers mobile filter opening, applying category/search/sort, removable chips, clear all, URL shareability, back/forward, no horizontal overflow, and recipe detail scanning at 375px/768px/1024px/1440px.
- No backend routes, schema changes, or fake filters are added.
