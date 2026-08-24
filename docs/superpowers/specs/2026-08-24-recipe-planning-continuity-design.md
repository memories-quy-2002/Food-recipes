# Recipe → Planning → Cooking Continuity Design

## Goal

Make the main recipe workflow continuous: a user can save a recipe, add it to a dated meal plan, start Cooking Mode with the planned context, finish cooking, and return to the plan without losing their place.

## Approved interaction

Recipe Detail exposes a compact action group with four actions:

```text
[ Start cooking ] [ Save ] [ Add to plan ] [ Add ingredients to shopping list ]
```

On desktop the actions stay together below the recipe metadata. On narrow screens the group becomes a sticky, full-width action bar inside the recipe summary so the important next action remains reachable without dominating the page.

`Add to plan` opens a modal/sheet in place. It defaults to today, `Dinner`, and 4 servings. The date remains editable; the dialog resolves the meal-plan week for the selected date. If that week has no plan, submission creates a plan named `This week` for that Monday–Sunday range, then adds the recipe. A successful add closes the sheet and announces the result through the existing toast provider.

Guests are redirected to `/account?signup=false` with the current recipe URL in router state. Authenticated users never leave Recipe Detail to choose the date, meal, or servings.

## Data flow

```text
Recipe Detail
  └─ Add to plan
      └─ AddToPlanDialog
          ├─ useMealPlanForWeekQuery(selectedWeek, { enabled: open })
          ├─ useCreateMealPlanMutation() when no plan exists
          └─ useAddMealPlanItemMutation() with recipe_id/date/slot/servings
```

The existing planning API remains the source of truth. No new backend route, table, or dependency is needed. The planning week query accepts an optional `enabled` flag so public recipe pages do not make authenticated planning requests until the user opens the authenticated dialog.

Cooking Mode already accepts `planningContext` from `/recipe/cooking`; this phase preserves that contract and verifies the complete/return actions with a journey test.

## Component boundaries

- `AddToPlanDialog.tsx` owns date, slot, servings, selected-week lookup, validation, create-then-add sequencing, and dialog-level error copy.
- `RecipeContainerSummary.jsx` owns presentation of the optional Add to Plan callback and pending state; it does not know planning API details.
- `Recipe.jsx` owns authentication intent, opening/closing the dialog, and success/error toasts.
- `MealSlot.tsx` remains the owner of planning-to-cooking deep links and existing remove/change actions.

## Accessibility and visual rules

- Use a semantic `role="dialog"` with `aria-modal="true"`, labelled heading, Escape close, visible focus styles, and labelled date/meal/servings controls.
- Keep every action/input at least 44px high, with an explicit disabled/busy state during create/add requests.
- Preserve the existing warm Food Recipes palette: dark coffee summary, cream surfaces, citrus accent, and high-contrast text. The one signature interaction is the sticky mobile action strip, which behaves like a recipe-card tab rather than a generic floating button.
- Use 150–300ms transitions, avoid layout-shifting hover effects, and disable motion under `prefers-reduced-motion`.
- Error and empty states state what happened and the next action; raw API messages never reach the user.

## Verification

- Vitest covers the Add to Plan dialog defaults, validation, existing-plan add, create-then-add, error state, Recipe Summary action, and existing Cooking Mode continuity.
- Playwright covers Recipe Detail → Add to Plan → Planning → Start cooking → Finish → Back to plan, plus mobile widths and no horizontal overflow.
- Run frontend lint/typecheck/full tests/build and backend typecheck/Prisma validation. Do not stage the user-owned `AGENTS.md` or `food-recipes-ai-agent-implementation-prompt.md` changes.
