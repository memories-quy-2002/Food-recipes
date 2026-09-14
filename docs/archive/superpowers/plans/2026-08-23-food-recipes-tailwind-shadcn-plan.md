# Food Recipes Tailwind v4 + shadcn/ui Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Tailwind CSS v4 and shadcn/ui foundation to the Vite frontend, then migrate one shared action component without disrupting Bootstrap or the existing SCSS screens.

**Architecture:** Tailwind v4 is loaded through the official Vite plugin and CSS-first imports. Preflight remains disabled while Bootstrap's CDN CSS and feature SCSS coexist. shadcn primitives live in the existing `src/frontend/shared/ui` boundary, use CSS-variable tokens for the current warm palette, and compose classes through a shared `cn` helper.

**Tech Stack:** React 19, Vite 8, Tailwind CSS v4, `@tailwindcss/vite`, shadcn/ui conventions, Radix Slot, `class-variance-authority`, `clsx`, `tailwind-merge`, Vitest, and React Test Renderer.

**Spec:** `docs/superpowers/specs/2026-08-23-food-recipes-tailwind-shadcn-design.md`

## Global Constraints

- Keep Bootstrap CSS, `react-bootstrap`, and all existing feature SCSS in place during this foundation migration.
- Do not import Tailwind Preflight while Bootstrap's CDN CSS remains in `src/frontend/index.html`.
- Use `src/frontend/shared/ui` for shadcn primitives and `src/frontend/shared/lib/utils.ts` for `cn`.
- Preserve the existing `@/*` alias, React/Vite configuration, API behavior, routes, and non-pilot screen markup.
- Use `tsx: false` in `src/frontend/components.json` because the current frontend is JavaScript-first JSX.
- Use the current warm palette through CSS variables; do not introduce a new visual brand in this task.
- Run tests first for every new runtime helper or component; configuration-only changes are verified with build/typecheck.
- Do not commit or push during this execution; preserve unrelated staged and dirty work in the repository.

---

### Task 1: Install and configure Tailwind CSS v4

**Files:**
- Modify: `src/frontend/package.json`
- Modify: `src/frontend/pnpm-lock.yaml`
- Modify: `src/frontend/vite.config.ts`
- Modify: `src/frontend/app/index.css`

**Interfaces:**
- Consumes: Existing Vite React plugin, `@/*` alias, global reset, font declarations, and Bootstrap CDN CSS.
- Produces: Tailwind v4 theme/utilities available to every frontend JSX file without Preflight.

- [x] **Step 1: Add the Tailwind and shadcn runtime dependencies**

Run from `src/frontend`:

```powershell
corepack pnpm@11.18.0 add tailwindcss@^4 @tailwindcss/vite@^4 class-variance-authority clsx tailwind-merge @radix-ui/react-slot lucide-react
```

Expected: only `src/frontend/package.json` and `src/frontend/pnpm-lock.yaml` change; the package manager remains `pnpm@11.18.0`.

- [x] **Step 2: Register the official Tailwind Vite plugin**

In `src/frontend/vite.config.ts`, add:

```ts
import tailwindcss from "@tailwindcss/vite";
```

Keep the existing Vite options and change the plugin list to:

```ts
plugins: [react(), tailwindcss()],
```

- [x] **Step 3: Add CSS-first Tailwind layers and semantic tokens**

At the top of `src/frontend/app/index.css`, add:

```css
@layer theme, base, components, utilities;
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/utilities.css" layer(utilities);

:root {
	--background: #fffaf3;
	--foreground: #211813;
	--card: #ffffff;
	--card-foreground: #211813;
	--primary: #d56b00;
	--primary-foreground: #ffffff;
	--secondary: #fff1d6;
	--secondary-foreground: #211813;
	--muted: #f5eee5;
	--muted-foreground: #6d6258;
	--accent: #fff1d6;
	--accent-foreground: #a84f00;
	--destructive: #c83220;
	--destructive-foreground: #ffffff;
	--border: rgba(98, 58, 18, 0.14);
	--input: rgba(98, 58, 18, 0.18);
	--ring: #ff9f1c;
	--radius: 0.5rem;
}

@theme inline {
	--color-background: var(--background);
	--color-foreground: var(--foreground);
	--color-card: var(--card);
	--color-card-foreground: var(--card-foreground);
	--color-primary: var(--primary);
	--color-primary-foreground: var(--primary-foreground);
	--color-secondary: var(--secondary);
	--color-secondary-foreground: var(--secondary-foreground);
	--color-muted: var(--muted);
	--color-muted-foreground: var(--muted-foreground);
	--color-accent: var(--accent);
	--color-accent-foreground: var(--accent-foreground);
	--color-destructive: var(--destructive);
	--color-destructive-foreground: var(--destructive-foreground);
	--color-border: var(--border);
	--color-input: var(--input);
	--color-ring: var(--ring);
	--radius-sm: calc(var(--radius) - 4px);
	--radius-md: calc(var(--radius) - 2px);
	--radius-lg: var(--radius);
	--radius-xl: calc(var(--radius) + 4px);
}
```

Keep the existing `*`, `body`, and `code` rules below the token block. Do not
add `@import "tailwindcss"`, because that would also import Preflight.

- [x] **Step 4: Verify the configuration-only foundation**

Run from `src/frontend`:

```powershell
corepack pnpm@11.18.0 run typecheck
corepack pnpm@11.18.0 run build
```

Expected: both commands exit with code 0 and the existing Bootstrap/SCSS imports remain unchanged.

### Task 2: Add shadcn metadata and the `cn` utility

**Files:**
- Create: `src/frontend/components.json`
- Create: `src/frontend/shared/lib/utils.ts`
- Test: `src/frontend/shared/lib/utils.test.ts`

**Interfaces:**
- Consumes: `@/*` alias and Tailwind utility generation from Task 1.
- Produces: `cn(...inputs: ClassValue[]): string` and shadcn CLI metadata for future primitives.

- [x] **Step 1: Write the failing `cn` behavior test**

Create `src/frontend/shared/lib/utils.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
	it("merges conditional classes and resolves Tailwind conflicts", () => {
		const shouldHide = false;

		expect(cn("px-2", shouldHide && "hidden", "px-4")).toBe("px-4");
	});
});
```

- [x] **Step 2: Run the focused test and verify RED**

Run:

```powershell
corepack pnpm@11.18.0 exec vitest run shared/lib/utils.test.ts
```

Expected: FAIL because `./utils` does not exist yet.

- [x] **Step 3: Implement the minimal `cn` utility**

Create `src/frontend/shared/lib/utils.ts`:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
```

- [x] **Step 4: Run the focused test and verify GREEN**

Run the same focused Vitest command. Expected: 1 test passes with 0 failures.

- [x] **Step 5: Add shadcn project metadata**

Create `src/frontend/components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "base-nova",
  "rsc": false,
  "tsx": false,
  "tailwind": {
    "config": "",
    "css": "app/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/shared",
    "utils": "@/shared/lib/utils",
    "ui": "@/shared/ui",
    "lib": "@/shared/lib",
    "hooks": "@/shared/hooks"
  },
  "iconLibrary": "lucide"
}
```

### Task 3: Implement and test the shadcn-style Button primitive

**Files:**
- Create: `src/frontend/shared/ui/Button.jsx`
- Test: `src/frontend/shared/ui/Button.test.jsx`

**Interfaces:**
- Consumes: `cn` from `@/shared/lib/utils` and CSS variables from `app/index.css`.
- Produces: `Button` with `variant`, `size`, `asChild`, `className`, and native button props.

- [x] **Step 1: Write the failing Button tests**

Create `src/frontend/shared/ui/Button.test.jsx`:

```jsx
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import Button from "./Button";

describe("Button", () => {
	it("defaults to an accessible primary button and merges classes", () => {
		let renderer;
		act(() => {
			renderer = TestRenderer.create(
				<Button className="custom-action">Save recipe</Button>
			);
		});

		const button = renderer.root.findByType("button");
		expect(button.props.type).toBe("button");
		expect(button.props["data-slot"]).toBe("button");
		expect(button.props.className).toContain("bg-primary");
		expect(button.props.className).toContain("custom-action");
	});

	it("supports destructive styling and rendering through Slot", () => {
		let renderer;
		act(() => {
			renderer = TestRenderer.create(
				<Button asChild variant="destructive" size="sm">
					<a href="/remove">Remove</a>
				</Button>
			);
		});

		const link = renderer.root.findByType("a");
		expect(link.props.href).toBe("/remove");
		expect(link.props.className).toContain("bg-destructive");
		expect(link.props.className).toContain("h-9");
	});
});
```

- [x] **Step 2: Run the focused tests and verify RED**

Run:

```powershell
corepack pnpm@11.18.0 exec vitest run shared/ui/Button.test.jsx
```

Expected: FAIL because `./Button` does not exist yet.

- [x] **Step 3: Implement the Button primitive**

Create `src/frontend/shared/ui/Button.jsx` with `React.forwardRef`, Radix
`Slot`, and `cva`. Use these exact variant groups:

```jsx
const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
				destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
				outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
				secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
				ghost: "hover:bg-accent hover:text-accent-foreground",
				link: "text-primary underline-offset-4 hover:underline",
			},
			size: {
				default: "h-10 px-4 py-2",
				sm: "h-9 rounded-md px-3",
				lg: "h-11 rounded-md px-8",
				icon: "size-10",
			},
		},
		defaultVariants: { variant: "default", size: "default" },
	}
);
```

The component must set `data-slot="button"`, default a native button to
`type="button"`, pass through remaining props, and use `cn` for the final
class name.

- [x] **Step 4: Run the focused tests and verify GREEN**

Run the same focused Vitest command. Expected: 2 tests pass with 0 failures.

### Task 4: Migrate PageState to the pilot primitive

**Files:**
- Modify: `src/frontend/shared/ui/PageState.jsx`
- Modify: `src/frontend/app/App.scss`
- Create: `src/frontend/shared/ui/PageState.test.jsx`

**Interfaces:**
- Consumes: `Button` from Task 3.
- Produces: Existing PageState API and semantics with the action rendered by the shared Button primitive.

- [x] **Step 1: Write the failing integration test**

Create `src/frontend/shared/ui/PageState.test.jsx`:

```jsx
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import PageState from "./PageState";

describe("PageState action", () => {
	it("renders the shared Button and invokes the supplied action", () => {
		const onAction = vi.fn();
		let renderer;

		act(() => {
			renderer = TestRenderer.create(
				<PageState
					type="error"
					title="Could not load"
					actionLabel="Try again"
					onAction={onAction}
				/>
			);
		});

		const button = renderer.root.findByType("button");
		expect(button.props["data-slot"]).toBe("button");
		act(() => button.props.onClick());
		expect(onAction).toHaveBeenCalledOnce();
	});
});
```

- [x] **Step 2: Run the focused test and verify RED**

Run:

```powershell
corepack pnpm@11.18.0 exec vitest run shared/ui/PageState.test.jsx
```

Expected: FAIL because the existing native button has no `data-slot="button"`.

- [x] **Step 3: Integrate Button and remove only the pilot's duplicated button CSS**

In `PageState.jsx`:

```jsx
import Button from "./Button";
```

Replace only the conditional action element with:

```jsx
<Button type="button" className="page-state__action mt-4" onClick={onAction}>
	{actionLabel}
</Button>
```

In `App.scss`, remove only the nested `.page-state button` rule and its hover
rule. Keep the `.page-state` layout, states, and all unrelated global styles.

- [x] **Step 4: Run the focused integration test and verify GREEN**

Run the same focused Vitest command. Expected: 1 test passes with 0 failures.

### Task 5: Document the new frontend styling foundation and run full gates

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: Completed frontend foundation and current package scripts.
- Produces: Repository documentation that distinguishes the new Tailwind/shadcn layer from the still-active Bootstrap/SCSS migration surface.

- [x] **Step 1: Update the root README tech stack**

Update the frontend stack to mention Tailwind CSS v4 and shadcn/ui as the new
incremental UI layer, and state that Bootstrap/SCSS remain during migration.
Add `components.json`, `shared/ui`, and `shared/lib/utils.ts` to the frontend
structure example.

- [x] **Step 2: Add an Unreleased changelog entry**

Record the Tailwind v4 Vite plugin, shadcn metadata, semantic tokens, `cn`
utility, and Button/PageState pilot. Do not claim that Bootstrap or all SCSS
has been removed.

- [x] **Step 3: Run the full frontend verification gates**

Run from `src/frontend`:

```powershell
corepack pnpm@11.18.0 run lint
corepack pnpm@11.18.0 run typecheck
corepack pnpm@11.18.0 run test:ci
corepack pnpm@11.18.0 run build
```

Expected: all commands exit with code 0, all existing tests remain green, and
the production build includes Tailwind utility output.
