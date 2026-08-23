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
	await page.getByRole("button", { name: "Open Chocolate Banana Bread" }).click();

	await expect(page).toHaveURL(/\/recipe\?id=1/);
});

test("guest Save action redirects from recipe detail to login", async ({ page }) => {
	await page.goto("/recipe?id=1");
	await page.getByRole("button", { name: "Add to favorite" }).click();

	await expect(page).toHaveURL(/\/account$/);
	await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
});
