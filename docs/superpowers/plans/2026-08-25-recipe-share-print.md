# Recipe Share and Print Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add browser-native share/copy and print actions to public recipe detail without a backend endpoint or third-party service.

**Architecture:** Keep URL generation and browser capability detection in pure/testable helpers. Use `navigator.share` first, clipboard fallback second, and a visible copy fallback last. Add scoped `@media print` rules to recipe detail so print output contains the recipe and hides interactive chrome.

**Tech Stack:** React/JSX, browser Web Share/Clipboard/Print APIs, existing toast/Button/PageHelmet primitives, Vitest/Testing Library, Playwright, CSS/SCSS.

**Spec:** `docs/superpowers/specs/2026-08-25-recipe-share-print-design.md`

## Global Constraints

- Work only on `feature/recipe-workflows`; do not commit to `master`.
- Do not add a PDF library, social SDK, share service, backend route, analytics event, or private-data URL.
- Preserve existing recipe detail actions, layout, mobile behavior, and authentication boundaries.
- Use accessible visible labels, focus-visible styles, 44px targets, status announcements, and reduced-motion-safe styles.
- Print must be legible in black and white and must not expose notes, pantry, history, or auth state.

---

### Task 1: Add pure sharing helpers

**Files:**
- Create: `src/frontend/features/recipes/share/recipeSharing.js`
- Create: `src/frontend/features/recipes/share/recipeSharing.test.js`

**Interfaces:**

```js
buildRecipeShareUrl(recipeId, origin);
shareRecipe({ title, text, url }, browser = window);
```

- [ ] **Step 1: Write failing helper tests** for canonical `/recipe?id=42` URL encoding, Web Share success, clipboard fallback, unavailable APIs, and browser rejection.
- [ ] **Step 2: Run focused tests to verify failure**

```powershell
cd src/frontend
pnpm exec vitest run features/recipes/share/recipeSharing.test.js
```

- [ ] **Step 3: Implement the capability order**

```js
if (typeof browser.navigator.share === 'function') {
  await browser.navigator.share({ title, text, url });
  return 'shared';
}
if (typeof browser.navigator.clipboard?.writeText === 'function') {
  await browser.navigator.clipboard.writeText(url);
  return 'copied';
}
throw new Error('SHARE_UNAVAILABLE');
```

Treat user cancellation as a quiet no-op where the browser exposes an abort error; show actionable copy for other failures.

- [ ] **Step 4: Run tests and lint**

```powershell
pnpm exec vitest run features/recipes/share/recipeSharing.test.js
pnpm exec eslint features/recipes/share/recipeSharing.js
```

- [ ] **Step 5: Commit the helper**

```powershell
git add src/frontend/features/recipes/share/recipeSharing.js src/frontend/features/recipes/share/recipeSharing.test.js
git commit -m "feat(recipes): add native recipe sharing helper"
```

### Task 2: Build accessible share and print controls

**Files:**
- Create: `src/frontend/features/recipes/share/ShareRecipeButton.jsx`
- Create: `src/frontend/features/recipes/share/PrintRecipeButton.jsx`
- Create: `src/frontend/features/recipes/share/ShareRecipeButton.test.jsx`
- Create: `src/frontend/features/recipes/share/PrintRecipeButton.test.jsx`
- Modify: `src/frontend/features/recipes/RecipeContainerSummary.jsx`

**Interfaces:**
- Consumes: recipe ID/name/description, `shareRecipe`, existing toast/status provider.
- Produces: labelled `Share recipe` and `Print recipe` buttons.

- [ ] **Step 1: Write failing component tests** for accessible names, pending state, share success, clipboard fallback, unsupported browser message, and `window.print()`.
- [ ] **Step 2: Run focused tests to verify failure**

```powershell
pnpm exec vitest run features/recipes/share/ShareRecipeButton.test.jsx features/recipes/share/PrintRecipeButton.test.jsx
```

- [ ] **Step 3: Implement the controls**

Use existing `Button` variants and icons with `aria-hidden`. Keep `isPending` local, disable repeated share requests, and announce result in an `aria-live="polite"` status. `PrintRecipeButton` should call `window.print` only inside the click handler.

- [ ] **Step 4: Place controls in the existing recipe CTA hierarchy**

Place share/print as secondary actions below the primary cooking/save/planning actions. Do not move or rename existing primary actions.

- [ ] **Step 5: Run focused tests/lint**

```powershell
pnpm exec vitest run features/recipes/share
pnpm exec eslint features/recipes/share features/recipes/RecipeContainerSummary.jsx
```

- [ ] **Step 6: Commit the controls**

```powershell
git add src/frontend/features/recipes/share src/frontend/features/recipes/RecipeContainerSummary.jsx
git commit -m "feat(recipes): add share and print actions"
```

### Task 3: Add print-specific styling

**Files:**
- Create: `src/frontend/features/recipes/Recipe.print.scss`
- Modify: `src/frontend/features/recipes/Recipe.jsx`
- Create: `src/frontend/features/recipes/Recipe.print.test.jsx`

- [ ] **Step 1: Write a failing print visibility test** that marks action/navigation/recommendation containers as hidden for print and keeps title, metadata, ingredients, nutrition, and instructions.
- [ ] **Step 2: Implement scoped `@media print` rules**

Hide header/footer/navigation, buttons, dialogs, save/rating controls, recommendations, carousels, and decorative backgrounds. Keep recipe content with black text, white background, stable image sizing, semantic heading breaks, and `break-inside: avoid` for ingredient/instruction items where practical.

- [ ] **Step 3: Run frontend tests and build**

```powershell
cd src/frontend
pnpm exec vitest run features/recipes/Recipe.print.test.jsx features/recipes/share
pnpm build
```

- [ ] **Step 4: Commit print styling**

```powershell
git add src/frontend/features/recipes/Recipe.print.scss src/frontend/features/recipes/Recipe.jsx src/frontend/features/recipes/Recipe.print.test.jsx
git commit -m "feat(recipes): add print recipe layout"
```

### Task 4: Verify browser share, fallback, and print output

**Files:**
- Create: `src/frontend/e2e/recipe-share-print-journey.spec.js`

- [ ] **Step 1: Add browser fixtures and stubs** for `navigator.share`, clipboard, and `window.print`; assert URL uses the existing public recipe path and no private fields are included.
- [ ] **Step 2: Run desktop/mobile E2E**

```powershell
pnpm test:e2e -- e2e/recipe-share-print-journey.spec.js
```

- [ ] **Step 3: Inspect print media behavior** with Playwright `page.emulateMedia({ media: 'print' })`; assert hidden interactive controls and visible recipe sections, plus no horizontal overflow at 390px.
- [ ] **Step 4: Run final frontend checks**

```powershell
pnpm check
pnpm build
```

- [ ] **Step 5: Commit the browser coverage**

```powershell
git add src/frontend/e2e/recipe-share-print-journey.spec.js
git commit -m "test(recipes): cover share and print journey"
```
