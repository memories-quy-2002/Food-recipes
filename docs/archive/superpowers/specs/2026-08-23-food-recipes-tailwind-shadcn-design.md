# Food Recipes Tailwind v4 + shadcn/ui Foundation

## Goal

Introduce Tailwind CSS v4 and shadcn/ui as an incremental frontend design-system
layer without breaking the existing Bootstrap and SCSS-based screens.

## Current context

- Frontend root: `src/frontend`.
- Runtime: React 19 with Vite 8 and JavaScript-first JSX plus selected
  TypeScript files.
- Vite and TypeScript already resolve `@/*` to the `src/frontend` directory.
- Global CSS starts at `src/frontend/app/index.css` and is imported by
  `src/frontend/main.jsx`.
- Bootstrap 5 CSS is loaded from the CDN in `src/frontend/index.html`.
- `react-bootstrap` is used by 22 frontend files and 14 feature/layout SCSS
  files remain active.
- Existing reusable UI lives under `src/frontend/shared/ui`, currently with
  state/toast components but no design-system primitives.
- Existing visual tokens are repeated as literal warm food-oriented colors,
  including `#fffaf3`, `#211813`, `#d56b00`, `#6d6258`, and `#fff1d6`.

## Design decisions

### Incremental coexistence

Tailwind utilities and shadcn/ui primitives will be added without deleting
Bootstrap, React Bootstrap, or feature SCSS. Existing screens keep their current
class names and behavior until each screen is deliberately migrated.

### Tailwind v4 integration

Use the official `@tailwindcss/vite` plugin in `src/frontend/vite.config.ts`.
Use CSS-first Tailwind v4 imports in `src/frontend/app/index.css` rather than a
Tailwind v3 config file.

During coexistence, omit Tailwind Preflight and import only the theme and
utilities layers. Bootstrap's CDN reset and the existing global reset remain
the source of base normalization until Bootstrap is removed.

```css
@layer theme, base, components, utilities;
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/utilities.css" layer(utilities);
```

### shadcn/ui placement and aliases

Use the existing shared UI boundary instead of introducing a second top-level
component tree:

- Primitives: `src/frontend/shared/ui`.
- Shared class utility: `src/frontend/shared/lib/utils.ts`.
- shadcn `ui` alias: `@/shared/ui`.
- shadcn `utils` alias: `@/shared/lib/utils`.

The project remains JavaScript-first, so generated shadcn components use JSX
(`tsx: false`) while the shared `cn` helper uses TypeScript and the existing
alias configuration.

### Theme tokens

Use CSS variables for shadcn semantic tokens and map the existing warm palette
into them. The first pass must not redesign the product palette; it only makes
the existing colors reusable by Tailwind utilities and shadcn components.

Required semantic tokens include background, foreground, card, card-foreground,
primary, primary-foreground, secondary, secondary-foreground, muted,
muted-foreground, accent, accent-foreground, destructive,
destructive-foreground, border, input, ring, and radius.

### First pilot component

Add a shadcn-style `Button` primitive with `class-variance-authority`,
`@radix-ui/react-slot`, `clsx`, and `tailwind-merge`. It must support:

- Variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, and
  `link`.
- Sizes: `default`, `sm`, `lg`, and `icon`.
- `asChild` composition through Radix Slot.
- Consumer `className` merging through `cn`.
- Keyboard-visible focus styles, disabled state, and native button behavior.

Migrate only the action button in `src/frontend/shared/ui/PageState.jsx` to
the new primitive. Preserve `PageState` loading/error/empty semantics,
`actionLabel`, `onAction`, and the existing `page-state` wrapper classes.

## Scope

### In scope

- Tailwind v4 Vite integration.
- shadcn/ui project metadata and alias configuration.
- CSS semantic tokens for the current warm palette.
- Shared `cn` utility.
- `Button` primitive and its focused test coverage.
- `PageState` pilot integration.
- Package lockfile and frontend documentation notes needed to run the setup.

### Out of scope

- Rewriting every SCSS file.
- Removing Bootstrap CSS from `index.html`.
- Removing `bootstrap` or `react-bootstrap` dependencies.
- Migrating Header, Auth, Food, Recipe, Profile, or Wishlist screens.
- Changing API calls, routes, authentication, forms, or server state.
- Enabling Tailwind Preflight before the Bootstrap migration is complete.
- Adding a full dark mode or changing the existing brand palette.

## Acceptance criteria

1. `src/frontend/package.json` and its lockfile contain the Tailwind v4 Vite
   plugin and the shadcn Button dependencies.
2. Vite loads `@tailwindcss/vite` without removing the existing React plugin,
   root, alias, build, or test settings.
3. `app/index.css` emits Tailwind theme/utilities and preserves the existing
   reset and global font behavior without importing Preflight.
4. `components.json` points to `app/index.css`, uses `tsx: false`, enables CSS
   variables, and resolves aliases against the current `@/*` configuration.
5. `cn` merges conditional classes and resolves conflicting Tailwind classes.
6. `Button` has the specified variants, sizes, composition behavior,
   accessibility states, and tests.
7. `PageState` still renders the same action only when both `actionLabel` and
   `onAction` are present, and the action invokes the supplied callback.
8. Existing frontend lint, typecheck, unit tests, and production build pass.
9. No existing API contract, route, or non-pilot screen behavior changes.

## Verification

Run from `src/frontend`:

```powershell
corepack pnpm@11.18.0 run lint
corepack pnpm@11.18.0 run typecheck
corepack pnpm@11.18.0 run test:ci
corepack pnpm@11.18.0 run build
```

The official integration references used for this design are Tailwind's Vite
plugin and Preflight documentation, plus shadcn/ui's Vite installation,
`components.json`, and `cn()` utility guidance.
