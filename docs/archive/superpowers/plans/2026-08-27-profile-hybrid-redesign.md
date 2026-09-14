# Profile Hybrid Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the authenticated Profile page into a lightweight kitchen hub with a useful Overview, separated account/content navigation, on-demand personal data loading, and clearer responsive form interactions.

**Architecture:** Keep the protected `/profile` route, React feature boundary, Redux auth state, Axios client, Tailwind styling, and existing backend endpoints. Add `ProfileOverview`, make the URL hash model explicit, move review loading into the Reviews section, and keep the existing content components focused on their own data and mutations.

**Tech Stack:** React 19, TypeScript, React Router, Redux Toolkit, Axios, Tailwind CSS, Vitest, Testing Library, Vite.

## Global Constraints

- The first phase is frontend-only; do not add database migrations or a profile summary endpoint.
- Keep `/profile` protected and preserve `#/password`, `#/recipes`, and `#/reviews`.
- Keep the old `#/` hash as an alias for Personal info; bare `/profile` opens Overview.
- Do not display fabricated counts, completion percentages, activity timelines, or unsupported email-verification claims.
- Do not add avatar upload or image storage.
- Keep Saved recipes, Meal planning, Shopping list, Pantry, and Cooking history as dedicated routes.
- Use visible labels for primary actions instead of icon-only controls.
- Preserve existing loading, empty, error, retry, toast, ownership, lifecycle, and confirmation behavior.
- Use safe error normalization for unknown API errors.
- Maintain keyboard accessibility, focus-visible indicators, semantic headings, `aria-current`, touch targets, and narrow-screen reflow.
- Do not extend the stale `Profile.scss` selector tree as the primary styling approach.
- Do not stage or alter unrelated existing worktree changes.

---

### Task 1: Add Profile Navigation Model And Overview

**Files:**
- Create: `src/frontend/features/profile/ProfileOverview.tsx`
- Modify: `src/frontend/features/profile/profileTypes.ts`
- Modify: `src/frontend/features/profile/Profile.tsx`
- Modify: `src/frontend/features/profile/ProfileMain.tsx`
- Modify: `src/frontend/features/profile/ProfileAside.tsx`
- Test: `src/frontend/features/profile/Profile.navigation.test.tsx`

**Interfaces:**
- `ProfilePage` becomes `"overview" | "personal-info" | "password" | "recipes" | "reviews"`.
- `ProfileOverview` consumes `ProfileUser | null | undefined` and returns a `ReactElement`.
- `ProfileMain` consumes `{ user: ProfileUser | null | undefined; page: ProfilePage }`.
- `getProfilePageFromHash(hash?: string): ProfilePage` maps no hash to `overview`, `#/` to `personal-info`, and named hashes to their sections.

- [ ] **Step 1: Write the failing navigation and Overview tests**

Create a focused test file that verifies the pure hash mapping and the rendered links. Use the existing `MemoryRouter` and Testing Library conventions.

```tsx
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ProfileAside from "./ProfileAside";
import ProfileOverview from "./ProfileOverview";
import { getProfilePageFromHash } from "./Profile";

describe("profile navigation", () => {

	it("maps the new and legacy hashes without changing named sections", () => {
		expect(getProfilePageFromHash()).toBe("overview");
		expect(getProfilePageFromHash("#/" )).toBe("personal-info");
		expect(getProfilePageFromHash("#/personal-info")).toBe("personal-info");
		expect(getProfilePageFromHash("#/password")).toBe("password");
		expect(getProfilePageFromHash("#/recipes")).toBe("recipes");
		expect(getProfilePageFromHash("#/reviews")).toBe("reviews");
	});

	it("renders grouped section links and kitchen quick actions", () => {
		render(
			<MemoryRouter>
				<ProfileAside
					name="Alex"
					page="overview"
					handleLogOut={() => undefined}
					handleChangePage={() => undefined}
				/>
			</MemoryRouter>,
		);
		expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute("href", "/profile");
		expect(screen.getByRole("link", { name: "Personal info" })).toHaveAttribute("href", "/profile#/personal-info");
		expect(screen.getByRole("link", { name: "Change password" })).toHaveAttribute("href", "/profile#/password");
	});

	it("renders Overview actions using existing protected routes", () => {
		render(
			<MemoryRouter>
				<ProfileOverview user={{ user_id: 1, full_name: "Alex", email: "alex@example.com" }} />
			</MemoryRouter>,
		);
		expect(screen.getByRole("link", { name: "Add a recipe" })).toHaveAttribute("href", "/food/add");
		expect(screen.getByRole("link", { name: "View saved recipes" })).toHaveAttribute("href", "/wishlist");
		expect(screen.getByRole("link", { name: /My recipes/ })).toHaveAttribute("href", "/profile#/recipes");
		expect(screen.getByRole("link", { name: /Meal planning/ })).toHaveAttribute("href", "/planning");
	});
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run from `src/frontend`:

```powershell
pnpm vitest run features/profile/Profile.navigation.test.tsx
```

Expected: FAIL because `ProfileOverview`, the expanded `ProfilePage` type, and the exported hash parser do not exist yet.

- [ ] **Step 3: Implement the explicit page model and Overview**

Update `profileTypes.ts`:

```ts
export type ProfilePage =
	| "overview"
	| "personal-info"
	| "password"
	| "recipes"
	| "reviews";
```

Export the parser from `Profile.tsx` and make the empty hash distinction explicit:

```ts
export const getProfilePageFromHash = (hash?: string): ProfilePage => {
	if (!hash) return "overview";
	const page = hash.replace(/^#\/?/, "");
	if (page === "") return "personal-info";
	return page === "personal-info" || page === "password" || page === "recipes" || page === "reviews"
		? page
		: "overview";
};
```

Change `profilePageList` to contain only Account and Your content entries, and render Overview separately. The Overview link must be `/profile`, while section links must be `/profile#/personal-info`, `/profile#/password`, `/profile#/recipes`, and `/profile#/reviews`.

Create `ProfileOverview.tsx` with labeled links and no network request:

```tsx
const kitchenLinks = [
	{ label: "My recipes", description: "Manage drafts, published recipes, and archived recipes.", to: "/profile#/recipes" },
	{ label: "My reviews", description: "Revisit ratings and written notes.", to: "/profile#/reviews" },
	{ label: "Saved recipes", description: "Open recipes you saved for later.", to: "/wishlist" },
	{ label: "Meal planning", description: "Organize recipes for the week.", to: "/planning" },
	{ label: "Cooking history", description: "Review recipes you have cooked.", to: "/history" },
] as const;

const ProfileOverview = ({ user }: ProfileOverviewProps): ReactElement => {
	const displayName = user?.full_name?.trim() || "Cook";
	const email = user?.email?.trim();

	return (
		<div className="grid gap-6">
			<header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">Your kitchen</p>
					<h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Welcome back, {displayName}</h1>
					<p className="mt-2 max-w-2xl text-muted-foreground">Manage your account and continue building your kitchen.</p>
				</div>
				<div className="flex flex-col gap-2 sm:flex-row">
					<Button asChild><Link to="/food/add">Add a recipe</Link></Button>
					<Button asChild variant="outline"><Link to="/wishlist">View saved recipes</Link></Button>
				</div>
			</header>
			<Card className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
				<div className="flex min-w-0 items-center gap-4">
					<IoPersonCircleSharp className="size-14 shrink-0 text-primary" aria-hidden="true" />
					<div className="min-w-0">
						<h2 className="text-xl font-bold">Account summary</h2>
						<p className="truncate font-semibold">{displayName}</p>
						{email ? <p className="truncate text-sm text-muted-foreground">{email}</p> : null}
					</div>
				</div>
				<div className="flex flex-wrap gap-2 sm:justify-end">
					<Button asChild variant="outline" size="sm"><Link to="/profile#/personal-info">Edit personal info</Link></Button>
					<Button asChild variant="ghost" size="sm"><Link to="/profile#/password">Change password</Link></Button>
				</div>
			</Card>
			<section aria-labelledby="kitchen-links-title">
				<h2 id="kitchen-links-title" className="text-2xl font-bold">Your kitchen</h2>
				<div className="mt-3 grid gap-3 sm:grid-cols-2">
					{kitchenLinks.map(({ label, description, to }) => (
						<Card as="article" key={to} className="p-0 transition-colors hover:border-primary/60">
							<Link to={to} className="block rounded-xl p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
								<h3 className="font-bold">{label}</h3>
								<p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
							</Link>
						</Card>
					))}
				</div>
			</section>
		</div>
	);
};
```

Use `Card as="article"` only when the card is not itself the link; the nested Link above remains the only interactive element in each card.

Update `ProfileMain.tsx` to render `ProfileOverview` for `page === "overview"` and remove the `reviewsData` prop. Update `Profile.tsx` initial state and hash effect to use the expanded type. Update `ProfileAside.tsx` to render grouped headings, Overview, section links, and Logout as separate areas.

- [ ] **Step 4: Run navigation tests to verify they pass**

Run:

```powershell
pnpm vitest run features/profile/Profile.navigation.test.tsx
```

Expected: PASS. Also run `pnpm typecheck` after fixing all exhaustive `ProfilePage` comparisons.

### Task 2: Move Reviews Loading Into The Active Section

**Files:**
- Modify: `src/frontend/features/profile/Profile.tsx`
- Modify: `src/frontend/features/profile/ProfileMain.tsx`
- Modify: `src/frontend/features/profile/Reviews.tsx`
- Create: `src/frontend/features/profile/Reviews.loading.test.tsx`

**Interfaces:**
- `ProfileMain` no longer accepts `reviewsData`.
- `Reviews` owns `ProfileRating[]`, loading, error, and retry state.
- The existing `apiRoutes.userRatings`, `getArrayPayload`, and `isProfileRating` remain the runtime boundary.

- [ ] **Step 1: Write the failing lazy-loading test**

Mock the shared Axios client and render `Reviews` only when explicitly requested by the test. Assert the endpoint is not called by rendering Overview in the same test setup, then assert it is called once when Reviews mounts.

```tsx
it("loads ratings when the Reviews section is mounted", async () => {
	get.mockResolvedValue({ data: { ratings: [] } });
	render(<Reviews />);
	await waitFor(() => expect(get).toHaveBeenCalledWith("/users/me/ratings"));
});

it("does not require ratings to render Overview", () => {
	render(<ProfileOverview user={{ user_id: 1 }} />);
	expect(get).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
pnpm vitest run features/profile/Reviews.loading.test.tsx
```

Expected: FAIL because `Reviews` does not own its request yet and Profile currently owns the rating state.

- [ ] **Step 3: Move the request and preserve states**

In `Profile.tsx`, remove the ratings state, rating loading/error state, rating request effect, `getApiErrorMessage` helper if no longer used, and the conditional PageState wrapper around `ProfileMain`. Keep user-independent logout error handling unchanged.

In `ProfileMain.tsx`, pass only `user` and `page`, and render `<Reviews />` for the reviews page.

In `Reviews.tsx`, add local state and a retryable fetch function:

```tsx
const [reviewsData, setReviewsData] = useState<ProfileRating[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

const fetchReviews = useCallback(async (): Promise<void> => {
	try {
		setIsLoading(true);
		setError(null);
		const response = await axios.get<unknown>(apiRoutes.userRatings);
		setReviewsData(getArrayPayload(response.data, "ratings", isProfileRating));
	} catch (requestError: unknown) {
		setError(getApiErrorMessage(requestError, "Unable to load your profile reviews."));
	} finally {
		setIsLoading(false);
	}
}, []);

useEffect(() => {
	void fetchReviews();
}, [fetchReviews]);

if (isLoading) return <PageState title="Loading reviews" message="Fetching your recipe reviews." />;
if (error) return <PageState type="error" title="Reviews could not load" message={error} actionLabel="Try again" onAction={fetchReviews} />;
```

Keep the current summary, empty state, recipe links, and review rendering after these guards. Use a local safe error normalizer rather than rendering an unknown response body.

- [ ] **Step 4: Run loading, error, and existing Profile tests**

Run:

```powershell
pnpm vitest run features/profile/Reviews.loading.test.tsx features/profile/Profile.navigation.test.tsx
pnpm typecheck
```

Expected: PASS with no review request caused by Overview or account settings.

### Task 3: Improve Personal Info Editing States

**Files:**
- Modify: `src/frontend/features/profile/PersonalInfo.tsx`
- Create: `src/frontend/features/profile/PersonalInfo.test.tsx`

**Interfaces:**
- Keep `ProfileUser` and `serializeProfilePayload` as the request contract.
- Keep Redux `authActions.updateUser` as the success boundary.
- Add local `isSaving` and an initial/dirty comparison; do not add a new API.

- [ ] **Step 1: Write failing form interaction tests**

Cover read-only email, disabled clean form, dirty state, cancel restoration, and save failure preserving input.

```tsx
it("shows email as read-only and enables save only after a change", async () => {
	render(<PersonalInfo user={{ user_id: 1, full_name: "Alex", email: "alex@example.com", phone: "", address: "" }} />);
	const save = screen.getByRole("button", { name: "Save changes" });
	expect(screen.getByDisplayValue("alex@example.com")).toHaveAttribute("readonly");
	expect(save).toBeDisabled();
	await userEvent.setup().clear(screen.getByLabelText("Full name"));
	expect(save).toBeEnabled();
});

it("restores the last saved values when cancel is pressed", async () => {
	const user = userEvent.setup();
	render(<PersonalInfo user={{ user_id: 1, full_name: "Alex", email: "alex@example.com" }} />);
	await user.clear(screen.getByLabelText("Full name"));
	await user.type(screen.getByLabelText("Full name"), "Changed");
	await user.click(screen.getByRole("button", { name: "Cancel" }));
	expect(screen.getByLabelText("Full name")).toHaveValue("Alex");
});
```

- [ ] **Step 2: Run the focused tests to verify they fail**

Run:

```powershell
pnpm vitest run features/profile/PersonalInfo.test.tsx
```

Expected: FAIL because email, cancel, and dirty-state behavior are not implemented.

- [ ] **Step 3: Implement the smallest local form-state change**

Use a typed `initialFormData` snapshot and derive `isDirty` from the current form. Reset the snapshot from the incoming `user` when the user identity changes. Render email as a read-only input or definition row with a stable label; it must not be submitted as an editable profile field.

```tsx
const getFormData = (user: ProfileUser | null | undefined): ProfileForm => ({
	name: user?.full_name || "",
	address: user?.address || "",
	phoneNumber: user?.phone || "",
});

const [formData, setFormData] = useState(() => getFormData(user));
const [initialFormData, setInitialFormData] = useState(() => getFormData(user));
const [isSaving, setIsSaving] = useState(false);
const isDirty = JSON.stringify(formData) !== JSON.stringify(initialFormData);
```

On successful `PUT`, update both form and initial snapshots from the response-normalized user. On failure, keep `formData`. Render `Cancel` only when dirty and make `Save changes` disabled when `!isDirty || isSaving`. The submit button text is `Saving...` while the request is active. Keep existing toast messages and safe API error handling.

- [ ] **Step 4: Run form tests and typecheck**

Run:

```powershell
pnpm vitest run features/profile/PersonalInfo.test.tsx
pnpm typecheck
```

Expected: PASS; failed saves leave edited values in the form.

### Task 4: Improve Change Password Feedback And Submission State

**Files:**
- Modify: `src/frontend/features/profile/ChangePassword.tsx`
- Create: `src/frontend/features/profile/ChangePassword.test.tsx`

**Interfaces:**
- Preserve the existing `PUT /users/me/password` payload `{ currentPassword, newPassword }`.
- Preserve Yup validation rules and server `401` message handling.
- Add typed field error state and `isSaving`; do not change the backend contract.

- [ ] **Step 1: Write failing password interaction tests**

Test visible requirements, server error, submit lock, show/hide control, and success reset.

```tsx
	it("shows password requirements and field visibility controls", async () => {
	render(<ChangePassword />);
	expect(screen.getByText("Minimum 8 characters")).toBeInTheDocument();
	const current = screen.getByLabelText("Current password");
	expect(current).toHaveAttribute("type", "password");
	const toggle = screen.getByRole("button", { name: "Show current password" });
	await userEvent.setup().click(toggle);
	expect(current).toHaveAttribute("type", "text");
});

it("keeps the form and exposes the server error when the current password is invalid", async () => {
	put.mockRejectedValue({ response: { status: 401, data: { message: "The current password is incorrect" } } });
	const user = userEvent.setup();
	render(<ChangePassword />);
	await user.type(screen.getByLabelText("Current password"), "old-password");
	await user.type(screen.getByLabelText("New password"), "new-password");
	await user.type(screen.getByLabelText("Confirm new password"), "new-password");
	await user.click(screen.getByRole("button", { name: "Save new password" }));
		expect(await screen.findByRole("alert")).toHaveTextContent("current password is incorrect");
});
```

- [ ] **Step 2: Run the focused tests to verify they fail**

Run:

```powershell
pnpm vitest run features/profile/ChangePassword.test.tsx
```

Expected: FAIL because requirements are only in header text, fields have no visibility controls, and submission has no explicit saving state.

- [ ] **Step 3: Implement field-level feedback and safe controls**

Add `isSaving` and a visibility map keyed by `PasswordField`. Use a `<button type="button">` adjacent to each password input with an accessible label that changes between `Show ... password` and `Hide ... password`. Keep the input label as the accessible name of the field.

Display `Minimum 8 characters` near the new password field before submit. Convert Yup `ValidationError.inner` into field-specific messages while retaining a general alert for server errors. Clear errors when the corresponding field changes. Set `isSaving` before the request and clear it in `finally`; disable submit when saving or when all fields are empty. On successful `200`, clear fields, hide password values, and keep the existing success toast.

- [ ] **Step 4: Run password tests and typecheck**

Run:

```powershell
pnpm vitest run features/profile/ChangePassword.test.tsx
pnpm typecheck
```

Expected: PASS with no payload or validation regression.

### Task 5: Make My Recipes And My Reviews Actions Explicit

**Files:**
- Modify: `src/frontend/features/profile/PersonalRecipes.tsx`
- Modify: `src/frontend/features/profile/Reviews.tsx`
- Modify: `src/frontend/features/profile/ProfileAside.tsx`
- Modify: `src/frontend/features/profile/ProfileMain.tsx`
- Modify: `src/frontend/features/profile/Profile.scss` only if an import or active usage is found; otherwise leave it untouched or remove it only as a separate confirmed cleanup.
- Update: `src/frontend/features/profile/PersonalRecipes.lifecycle.test.tsx`
- Create: `src/frontend/features/profile/Reviews.content.test.tsx`

**Interfaces:**
- Preserve all existing recipe lifecycle endpoints and ownership checks.
- Preserve review response validation and recipe navigation.
- Preserve `PageState`, toast, and delete confirmation behavior.

- [ ] **Step 1: Write failing action-label and review-content tests**

Add assertions that primary recipe actions expose visible names in the normal layout and that Reviews shows the empty review fallback and recipe action.

```tsx
it("exposes lifecycle actions with visible labels", async () => {
	render(<MemoryRouter><PersonalRecipes user={{ user_id: 1 }} /></MemoryRouter>);
	expect(await screen.findByRole("button", { name: "Publish recipe Soup" })).toBeInTheDocument();
	// The action row must expose the action text, not only an unlabeled icon.
	expect(screen.getByText("Publish")).toBeInTheDocument();
});

it("shows review fallback text and a recipe action", () => {
	render(
		<MemoryRouter>
			<Reviews reviewsData={[{ rating_id: 1, recipe_id: 4, recipe_name: "Soup", image_url: null, score: 4, review: "" }]} />
		</MemoryRouter>,
	);
	expect(screen.getByText("No written review yet.")).toBeInTheDocument();
	expect(screen.getByRole("button", { name: "View recipe Soup" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the focused tests to verify the new assertions fail**

Run:

```powershell
pnpm vitest run features/profile/PersonalRecipes.lifecycle.test.tsx features/profile/Reviews.content.test.tsx
```

Expected: the new visible-label assertions fail against the icon-only action row and current review action markup.

- [ ] **Step 3: Replace primary icon-only actions with labeled controls**

In `PersonalRecipes`, keep the existing action availability by status, but render visible labels for the primary actions. Use compact icon-plus-text buttons where the card has room. Keep `aria-label` and `title` for any secondary icon-only control that remains. The resulting status action sets are:

```text
Draft: Edit, Publish, Delete
Published: View, Edit, Archive, Delete
Archived: Restore, Delete
```

Keep each recipe action disabled only while its own recipe is busy. Keep the confirmation modal, destructive styling, and existing endpoint calls unchanged.

In `Reviews`, keep the derived ratings/comments summary and review response shape. Give the recipe action a visible `View recipe` label and accessible name containing the recipe name. Keep the empty state link to `/food` and the existing fallback copy.

Update `ProfileAside` and `ProfileMain` props to match the new Overview/page model. Do not add duplicate implementations of saved recipes, planning, pantry, shopping list, or history.

- [ ] **Step 4: Run content tests and typecheck**

Run:

```powershell
pnpm vitest run features/profile/PersonalRecipes.lifecycle.test.tsx features/profile/Reviews.content.test.tsx
pnpm typecheck
```

Expected: PASS with existing lifecycle calls and delete behavior preserved.

### Task 6: Apply Responsive And Accessibility Verification

**Files:**
- Modify: `src/frontend/features/profile/Profile.tsx`
- Modify: `src/frontend/features/profile/ProfileAside.tsx`
- Modify: `src/frontend/features/profile/ProfileMain.tsx`
- Modify: `src/frontend/features/profile/ProfileOverview.tsx`
- Modify: `src/frontend/features/profile/PersonalInfo.tsx`
- Modify: `src/frontend/features/profile/ChangePassword.tsx`
- Modify: `src/frontend/features/profile/PersonalRecipes.tsx`
- Modify: `src/frontend/features/profile/Reviews.tsx`
- Create: `src/frontend/features/profile/Profile.responsive.test.tsx`

**Interfaces:**
- Reuse shared `Button`, `Card`, `Input`, `Label`, and `PageState` components.
- Reuse the global `:focus-visible` treatment and reduced-motion behavior.

- [ ] **Step 1: Write responsive and semantic assertions**

Test the rendered semantics rather than relying only on class snapshots:

```tsx
it("exposes one profile navigation landmark and an active section", () => {
	render(
		<MemoryRouter>
			<ProfileAside name="Alex" page="overview" handleLogOut={() => undefined} handleChangePage={() => undefined} />
		</MemoryRouter>,
	);
	expect(screen.getByRole("navigation", { name: "Profile sections" })).toBeInTheDocument();
	expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
});

it("keeps the overview actions keyboard-addressable", () => {
	render(<MemoryRouter><ProfileOverview user={{ user_id: 1 }} /></MemoryRouter>);
	for (const link of screen.getAllByRole("link")) expect(link).toBeVisible();
});
```

- [ ] **Step 2: Run the test to verify any missing semantics**

Run:

```powershell
pnpm vitest run features/profile/Profile.responsive.test.tsx
```

Expected: FAIL only for semantics not yet present; use the output to make focused markup corrections rather than adding snapshot-only assertions.

- [ ] **Step 3: Implement responsive and focus-safe markup**

Use a two-column desktop shell and one-column mobile shell. Keep the sidebar sticky only at the desktop breakpoint. Use `overflow-x-auto` only on the mobile section navigation container, not on the page root. Ensure all links and buttons retain at least the shared `min-h-11` target.

Use one page-level `h1` in the active content component. Give grouped navigation headings text or screen-reader-only labels. Keep `aria-current="page"` on the active link. Use links for navigation and buttons for mutations. When the active hash changes, focus the new content heading using a stable ref without stealing focus from a direct user click when the browser already moved focus appropriately.

Keep the delete dialog labeled by its heading, modal semantics, keyboard dismissal, and focus return. Do not introduce a new modal library.

- [ ] **Step 4: Run accessibility-focused tests**

Run:

```powershell
pnpm vitest run features/profile/Profile.responsive.test.tsx features/profile/Profile.navigation.test.tsx
```

Expected: PASS with no page-level overflow-causing fixed widths in the Profile shell.

### Task 7: Run Full Frontend Verification And Review The Diff

**Files:**
- Review only the files changed by Tasks 1-6.
- Do not include unrelated pre-existing modified or untracked files.

- [ ] **Step 1: Run the focused Profile test set**

Run:

```powershell
pnpm vitest run features/profile
```

Expected: PASS for all Profile tests, including the existing recipe lifecycle test.

- [ ] **Step 2: Run the required package checks**

Run from `src/frontend`:

```powershell
pnpm typecheck
pnpm lint
pnpm test:ci
pnpm build
```

Expected: all commands exit with code 0. If an existing unrelated baseline failure appears, record the exact command, file, and error without modifying unrelated files.

- [ ] **Step 3: Review the final diff and status**

Run:

```powershell
git diff --check -- src/frontend/features/profile docs/superpowers/specs/2026-08-27-profile-hybrid-redesign-design.md docs/superpowers/plans/2026-08-27-profile-hybrid-redesign.md
```

Confirm that the Profile implementation does not add backend files, migrations, new dependencies, fabricated metrics, or edits to unrelated worktree changes. Do not commit unless the user explicitly requests a commit.

## Plan Self-Review

- **Spec coverage:** Tasks 1 and 6 cover the Overview, grouped navigation, URL compatibility, responsive layout, focus, headings, and touch targets. Task 2 covers on-demand reviews loading and safe error states. Tasks 3 and 4 cover Personal info and Change password interactions. Task 5 covers recipes, reviews, labeled actions, empty states, and mutation preservation. Task 7 covers typecheck, lint, tests, build, and diff isolation.
- **Placeholder scan:** The plan contains no unresolved placeholder or unspecified implementation step. The Overview snippet includes the exact required link items.
- **Type consistency:** `ProfilePage`, `getProfilePageFromHash`, `ProfileOverview` props, and the simplified `ProfileMain` props are defined in Task 1 and reused consistently by later tasks.
- **Scope check:** All tasks remain within the Profile feature and its focused tests. Existing protected routes and backend contracts are reused; no independent subsystem requires decomposition.
