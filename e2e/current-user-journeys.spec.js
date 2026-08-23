import { test, expect } from "@playwright/test";

const recipes = [
	{
		recipe_id: 1,
		recipe_name: "Chocolate Banana Bread",
		category_id: 1,
		category_name: "Desserts",
		meal_id: 1,
		meal_name: "Breakfast",
		num_ratings: 12,
		overall_score: 4.8,
		prep_time: "15 mins",
		cook_time: "45 mins",
		description: "A soft banana bread with chocolate.",
		ingredients: ["Bananas", "Flour"],
		instructions: ["Mix ingredients", "Bake until done"],
	},
	{
		recipe_id: 2,
		recipe_name: "Chicken Tikka Masala",
		category_id: 2,
		category_name: "Main Course",
		meal_id: 2,
		meal_name: "Dinner",
		num_ratings: 8,
		overall_score: 4.5,
		prep_time: "20 mins",
		cook_time: "35 mins",
		description: "A warmly spiced chicken dinner.",
		ingredients: ["Chicken", "Tomato"],
		instructions: ["Season chicken", "Cook until tender"],
	},
];

async function stubRecipeApi(page) {
	await page.route("**/recipes", (route) =>
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ recipes }),
		})
	);
	await page.route("**/recipes/*", (route) => {
		const id = Number(new URL(route.request().url()).pathname.split("/").pop());
		const recipe = recipes.find((item) => item.recipe_id === id) || recipes[0];
		return route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ recipe }),
		});
	});
	await page.route("**/categories", (route) =>
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ categories: [
				{ id: 1, name: "Desserts" },
				{ id: 2, name: "Main Course" },
			] }),
		})
	);
	await page.route("**/meals", (route) =>
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ meals: [
				{ id: 1, name: "Breakfast" },
				{ id: 2, name: "Dinner" },
			] }),
		})
	);
	await page.route("**/reviews", (route) =>
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ reviews: [] }),
		})
	);
}

async function authenticateAsTestUser(page) {
	// This is a frontend smoke fixture, not an authorization bypass: backend
	// authorization remains covered by the backend contract tests.
	let saved = false;
	await page.addInitScript(() => {
		localStorage.setItem("isAuthenticated", "true");
		localStorage.setItem(
			"user",
			JSON.stringify({ user_id: 7, full_name: "Smoke User" })
		);
		localStorage.setItem("jwt", "test-scoped-smoke-token");
	});
	await page.route("**/auth/token", (route) =>
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ user: { user_id: 7, full_name: "Smoke User" } }),
		})
	);
	await page.route("**/users/7/wishlist", (route) => {
		if (route.request().method() === "GET") {
			return route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ wishlist: saved ? [{ recipe_id: 1 }] : [] }),
			});
		}
		if (route.request().method() === "POST") {
			saved = true;
			return route.fulfill({ status: 200, body: "{}" });
		}
		return route.fallback();
	});
	await page.route("**/users/7/wishlist/1", (route) => {
		if (route.request().method() === "DELETE") {
			saved = false;
			return route.fulfill({ status: 200, body: "{}" });
		}
		return route.fallback();
	});
}

test.beforeEach(async ({ page }) => {
	await stubRecipeApi(page);
});

test("guest searches Home and opens recipe detail", async ({ page }) => {
	await page.goto("/");
	await page.getByPlaceholder("Search recipes...").first().fill("Chocolate");
	await page.getByText("Chocolate Banana Bread", { exact: true }).first().click();

	await expect(page).toHaveURL(/\/recipe\?id=1/);
	await expect(page.getByRole("heading", { name: "Chocolate Banana Bread" })).toBeVisible();
});

test("Home featured recipe card exposes a focusable link with native Enter navigation", async ({ page }) => {
	await page.goto("/");

	const recipeLink = page.getByRole("link", { name: "Open Chocolate Banana Bread" });
	await expect(recipeLink).toHaveAttribute("href", "/recipe?id=1");
	await recipeLink.focus();
	await expect(recipeLink).toBeFocused();
	await recipeLink.press("Enter");

	await expect(page).toHaveURL(/\/recipe\?id=1$/);
});

test("authenticated Home favorite is a separate keyboard control and stays on Home", async ({ page }) => {
	await authenticateAsTestUser(page);
	await page.goto("/");

	const recipeLink = page.getByRole("link", { name: "Open Chocolate Banana Bread" });
	const favoriteButton = page.getByRole("button", { name: "Add to favorite" }).first();

	await expect(recipeLink).toHaveAttribute("href", "/recipe?id=1");
	await favoriteButton.focus();
	await expect(favoriteButton).toBeFocused();
	await favoriteButton.press("Enter");

	await expect(page).toHaveURL(/\/$/);
	await expect(page.getByRole("button", { name: "Remove from favorite" }).first()).toBeVisible();
});

test("guest navigates Home search results with accessible keyboard behavior", async ({ page }) => {
	await page.goto("/?q=a");

	const input = page.getByRole("combobox", { name: "Search recipes" });
	const listbox = page.getByRole("listbox", { name: "Recipe search results" });
	const options = listbox.getByRole("option");

	await expect(input).toHaveAttribute("aria-expanded", "true");
	await expect(input).toHaveAttribute("aria-controls", "recipe-search-results");
	await expect(listbox).toBeVisible();
	await expect(options).toHaveCount(2);
	await expect(options.first()).toHaveAttribute("role", "option");

	await input.focus();
	await input.press("ArrowDown");
	await expect(input).toHaveAttribute(
		"aria-activedescendant",
		"recipe-search-option-0"
	);
	await expect(options.first()).toHaveAttribute("aria-selected", "true");
	await expect(input).toBeFocused();

	await input.press("ArrowUp");
	await expect(input).toHaveAttribute(
		"aria-activedescendant",
		"recipe-search-option-1"
	);
	await expect(input).toBeFocused();
	await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");

	await input.press("ArrowDown");
	await expect(input).toHaveAttribute(
		"aria-activedescendant",
		"recipe-search-option-0"
	);
	await expect(options.first()).toHaveAttribute("aria-selected", "true");
	await expect(options.first()).toHaveAttribute("tabindex", "-1");

	await input.press("Enter");
	await expect(page).toHaveURL(/\/recipe\?id=1$/);
	await expect(page.getByRole("heading", { name: "Chocolate Banana Bread" })).toBeVisible();

	await page.goto("/?q=Chicken");
	const reopenedInput = page.getByRole("combobox", { name: "Search recipes" });
	const reopenedListbox = page.getByRole("listbox", { name: "Recipe search results" });
	await reopenedInput.focus();
	await reopenedInput.press("Escape");
	await expect(reopenedInput).toBeFocused();
	await expect(reopenedInput).toHaveValue("Chicken");
	await expect(reopenedInput).toHaveAttribute("aria-expanded", "false");
	await expect(reopenedListbox).toBeHidden();
	await expect(page).toHaveURL(/\/\?q=Chicken$/);

	await page.goto("/");
	const emptyInput = page.getByRole("combobox", { name: "Search recipes" });
	await emptyInput.fill("does-not-exist");
	const emptyListbox = page.getByRole("listbox", { name: "Recipe search results" });
	await expect(emptyListbox).toHaveAttribute("aria-live", "polite");
	await expect(emptyListbox.getByRole("option")).toHaveText("No recipe found");
	await expect(emptyInput).toBeFocused();
	await expect(page).toHaveURL(/\/\?q=does-not-exist$/);
});

test("guest selects a Home category and opens a matching recipe", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("button", { name: /Desserts.*Filter featured recipes/ }).click();
	await page.getByText("Chocolate Banana Bread", { exact: true }).last().click();

	await expect(page).toHaveURL(/\/recipe\?id=1/);
});

test("guest filters and sorts Recipes before opening a result", async ({ page }) => {
	await page.goto("/food");
	await page.getByRole("button", { name: "Desserts" }).click();
	await expect(page).toHaveURL(/categories=1/);
	await page.getByLabel("Sort").selectOption("name");
	await page.getByRole("link", { name: "Open Chocolate Banana Bread" }).click();

	await expect(page).toHaveURL(/\/recipe\?id=1/);
});

test("food listing recipe card exposes the correct href and navigates on Enter", async ({ page }) => {
	await page.goto("/food");

	const recipeLink = page.getByRole("link", { name: "Open Chocolate Banana Bread" });
	await expect(recipeLink).toHaveAttribute("href", "/recipe?id=1");
	await recipeLink.focus();
	await expect(recipeLink).toBeFocused();
	await recipeLink.press("Enter");

	await expect(page).toHaveURL(/\/recipe\?id=1$/);
});

test("guest Save action redirects from recipe detail to login", async ({ page }) => {
	await page.goto("/recipe?id=1");
	await page.getByRole("button", { name: "Add to favorite" }).click();

	await expect(page).toHaveURL(/\/account$/);
	await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
});

test("authenticated user saves and unsaves a recipe", async ({ page }) => {
	await authenticateAsTestUser(page);
	await page.goto("/recipe?id=1");
	await expect(page).toHaveURL(/\/recipe\?id=1/);
	await expect(
		page.getByRole("heading", { name: "Chocolate Banana Bread" })
	).toBeVisible();

	const favoriteButton = page.getByRole("button", { name: "Add to favorite" });
	await favoriteButton.click();
	await expect(
		page.getByRole("button", { name: "Remove from favorite" })
	).toBeVisible();

	await page.getByRole("button", { name: "Remove from favorite" }).click();
	await expect(
		page.getByRole("button", { name: "Add to favorite" })
	).toBeVisible();
});
