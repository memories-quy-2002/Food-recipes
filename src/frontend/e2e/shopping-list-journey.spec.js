import { expect, test } from "@playwright/test";
import { bootstrapTestAuth } from "./auth-fixtures";

const recipe = {
	recipe_id: 7,
	recipe_name: "Chicken Curry",
	category_id: 2,
	category_name: "Main Course",
	meal_id: 2,
	meal_name: "Dinner",
	num_ratings: 8,
	overall_score: 4.5,
	prep_time_minutes: 20,
	cook_time_minutes: 35,
	total_time_minutes: 55,
	user_id: 12,
	recipe_description: "A warmly spiced chicken dinner.",
	date_added: null,
	image_url: null,
	ingredients: ["2 eggs", "olive oil"],
	instructions: ["Season chicken", "Cook until tender"],
};

const json = (body, status = 200) => ({
	status,
	contentType: "application/json",
	body: JSON.stringify(body),
});

async function stubRecipeApi(page) {
	await page.route("**/recipes", (route) =>
		route.fulfill(
			json({
				recipes: [recipe],
				pagination: {
					page: 1,
					limit: 100,
					total: 1,
					totalPages: 1,
					hasNext: false,
				},
			})
		)
	);
	await page.route("**/recipes/*", (route) => route.fulfill(json({ recipe })));
	await page.route("**/reviews", (route) => route.fulfill(json({ reviews: [] })));
}

async function authenticateAsTestUser(page) {
	await bootstrapTestAuth(page, undefined, "test-memory-shopping-token");
	await page.route("**/users/me/wishlist", (route) =>
		route.fulfill(json({ wishlist: [] }))
	);
	await page.route("**/users/me/ratings", (route) =>
		route.fulfill(json({ ratings: [] }))
	);
	await page.route("**/users/me/pantry", (route) =>
		route.fulfill(json({ items: [{ pantry_id: 1, name: "olive oil", have: true }] }))
	);
}

async function stubShoppingApi(page) {
	let items = [];
	let nextItemId = 1;

	await page.route("**/users/me/shopping-list", async (route) => {
		const request = route.request();
		if (request.method() !== "GET") return route.fallback();
		return route.fulfill(json({ items }));
	});

	await page.route("**/users/me/shopping-list/items", async (route) => {
		const request = route.request();
		if (request.method() !== "POST") return route.fallback();

		const body = JSON.parse(request.postData() || "{}");
		const item = {
			item_id: nextItemId++,
			label: body.label,
			quantity: body.quantity ?? null,
			source_recipe_id: null,
			source_recipe_name: null,
			checked: false,
		};
		items = [...items, item];
		return route.fulfill(json({ item }, 201));
	});

	await page.route("**/users/me/shopping-list/items/*", async (route) => {
		const request = route.request();
		const itemId = Number(new URL(request.url()).pathname.split("/").pop());
		const item = items.find((candidate) => candidate.item_id === itemId);

		if (request.method() === "PATCH") {
			const body = JSON.parse(request.postData() || "{}");
			Object.assign(item, body);
			return route.fulfill(json({ item }));
		}

		if (request.method() === "DELETE") {
			items = items.filter((candidate) => candidate.item_id !== itemId);
			return route.fulfill(json({ message: "Shopping list item removed" }));
		}

		return route.fallback();
	});

	await page.route("**/users/me/shopping-list/completed", async (route) => {
		if (route.request().method() !== "DELETE") return route.fallback();
		const removed = items.filter((item) => item.checked).length;
		items = items.filter((item) => !item.checked);
		return route.fulfill(json({ removed }));
	});

	await page.route("**/users/me/shopping-list/from-recipe", async (route) => {
		if (route.request().method() !== "POST") return route.fallback();
		const addedItems = recipe.ingredients.map((label) => ({
			item_id: nextItemId++,
			label,
			quantity: null,
			source_recipe_id: recipe.recipe_id,
			source_recipe_name: recipe.recipe_name,
			checked: false,
		}));
		items = [...items, ...addedItems];
		return route.fulfill(json({ recipe: recipe.recipe_name, items: addedItems }));
	});
}

test("authenticated user manages a manual list and imports recipe ingredients", async ({ page }) => {
	await stubRecipeApi(page);
	await authenticateAsTestUser(page);
	await stubShoppingApi(page);

	await page.goto("/shopping-list");
	await expect(page.getByRole("heading", { name: "Your shopping list is empty" })).toBeVisible();

	await page.getByLabel("Item").fill("milk");
	await page.getByLabel(/Quantity/).fill("1 carton");
	await page.getByRole("button", { name: "Add item" }).click();
	await expect(page.locator(".shopping-list__item").filter({ hasText: "milk" })).toBeVisible();

	await page.getByRole("checkbox", { name: "Mark milk as purchased" }).click();
	await expect(page.getByRole("checkbox", { name: "Mark milk as not needed" })).toBeChecked();

	await page.getByRole("button", { name: "Edit milk" }).click();
	const milkRow = page.locator(".shopping-list__item").filter({ has: page.locator(".shopping-list__edit-form") });
	await milkRow.getByLabel("Item").fill("whole milk");
	await milkRow.getByRole("button", { name: "Save changes" }).click();
	await expect(page.locator(".shopping-list__item").filter({ hasText: "whole milk" })).toBeVisible();

	await page.getByLabel("Item").fill("tea");
	await page.getByRole("button", { name: "Add item" }).click();
	await page.getByRole("button", { name: "Delete tea" }).click();
	await expect(page.getByText("tea", { exact: true })).toHaveCount(0);

	await page.getByRole("button", { name: "Clear completed" }).click();
	await expect(page.locator(".shopping-list__item").filter({ hasText: "whole milk" })).toHaveCount(0);

	await page.goto(`/recipe?id=${recipe.recipe_id}`);
	await expect(page.getByRole("button", { name: "Add ingredients to shopping list" })).toBeVisible();
	await page.getByRole("button", { name: "Add ingredients to shopping list" }).click();
	await expect(page.getByText("2 ingredients added to Shopping List", { exact: true })).toBeVisible();

	await page.goto("/shopping-list");
	await expect(page.locator(".shopping-list__item").filter({ hasText: "2 eggs" })).toBeVisible();
	await expect(page.locator(".shopping-list__item").filter({ hasText: "olive oil" })).toBeVisible();
	await expect(page.getByRole("link", { name: "From Chicken Curry" }).first()).toHaveAttribute("href", "/recipe?id=7");
});

test("keeps the shopping list usable across requested responsive breakpoints", async ({ page }) => {
	await stubRecipeApi(page);
	await authenticateAsTestUser(page);
	await stubShoppingApi(page);

	for (const width of [375, 768, 1024, 1440]) {
		await page.setViewportSize({ width, height: 900 });
		await page.goto("/shopping-list");
		await expect(page.getByRole("heading", { name: "Your shopping list is empty" })).toBeVisible();

		const audit = await page.evaluate(() => {
			const controls = Array.from(document.querySelectorAll(".shopping-list-page button, .shopping-list-page input, .shopping-list-page a"));
			return {
				viewportWidth: window.innerWidth,
				documentWidth: document.documentElement.scrollWidth,
				controlViolations: controls
					.filter((control) => {
						const box = control.getBoundingClientRect();
						return box.width < 44 || box.height < 44;
					})
					.map((control) => control.textContent?.trim() || control.getAttribute("aria-label")),
				columns: getComputedStyle(document.querySelector(".shopping-list__layout")).gridTemplateColumns.split(" ").length,
			};
		});

		expect(audit.documentWidth).toBeLessThanOrEqual(audit.viewportWidth);
		expect(audit.controlViolations).toEqual([]);
		expect(audit.columns).toBe(width >= 1024 ? 2 : 1);
	}
});
