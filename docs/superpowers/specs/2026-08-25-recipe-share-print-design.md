# Recipe Share and Print Design

## Status

Approved direction for implementation planning.

## Goal

Make public recipes easy to share and print using browser-native capabilities, without adding a third-party sharing service or a new backend endpoint.

## Current context

- Public recipe detail is already addressable as `/recipe?id=<recipeId>`.
- Recipe detail already renders ingredients, serving controls, instructions, metadata, ratings, and nutrition/allergen information when available.
- The app already has toast feedback, `PageHelmet`, shared buttons, and responsive styling.
- No share action or print-specific presentation currently exists.

## Product behavior

1. Add a labelled `Share recipe` action to public recipe detail.
2. Use `navigator.share` when available with title, description, and canonical recipe URL.
3. Fall back to `navigator.clipboard.writeText` and then a temporary visible text fallback when Web Share or Clipboard APIs are unavailable.
4. Show a success toast/status after a share or copy operation. Share failures are actionable and do not expose raw browser errors.
5. Add a labelled `Print recipe` action that calls `window.print()` after the recipe is rendered.
6. Print output includes recipe title, description, image when printable, timing/servings, ingredients, nutrition/allergens, and instructions. It hides navigation, save/rating/share controls, carousels, dialogs, decorative backgrounds, and unrelated recommendations.
7. Print CSS keeps headings with their following content, avoids splitting an ingredient or instruction item where practical, preserves readable contrast, and uses a one-column layout.
8. The shared URL remains the existing public recipe URL and does not expose authentication state, private notes, pantry data, or cooking history.

## Architecture

Add a focused `ShareRecipeButton` and `PrintRecipeButton` under the recipe feature, using the existing `Button` and toast provider. Keep URL generation in a pure helper so it can be tested without a browser. Add print rules in the recipe stylesheet or a dedicated print stylesheet loaded by the recipe detail; do not add a PDF library.

```ts
buildRecipeShareUrl(recipeId: number | string, origin?: string): string;
shareRecipe(input: { title: string; text: string; url: string }): Promise<"shared" | "copied">;
```

The actions are available for public recipes regardless of authentication. Existing protected save, collection, note, planning, and shopping actions remain unchanged.

## Error and accessibility behavior

- Buttons have visible text and accessible names; icons are decorative.
- Share and print actions are keyboard reachable with visible focus and at least 44px touch targets.
- Copy success/failure is announced in an `aria-live="polite"` region and reflected in the toast.
- `window.print` is not called during server rendering or when the action is unavailable.
- The print view does not rely on color alone and remains legible in black and white.
- No horizontal overflow is introduced at 390px mobile width.

## Testing and acceptance criteria

- Unit tests cover canonical URL generation, Web Share success, clipboard fallback, unsupported APIs, and browser errors.
- Component tests cover accessible names, pending/success/error states, and `window.print` invocation.
- Browser tests cover share fallback with a stubbed clipboard and print action with a stubbed print function.
- Visual/browser inspection confirms desktop and mobile recipe detail remain unchanged outside the new actions and that print media hides interactive chrome.
- Axe and keyboard checks pass for the new controls.

## Out of scope

- Server-generated PDFs, social network SDKs, private collection sharing, collaborative plans, expiring share tokens, or link analytics.
