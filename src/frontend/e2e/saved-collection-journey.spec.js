import { test, expect } from "@playwright/test";
import { bootstrapTestAuth } from "./auth-fixtures";

const recipe = {
	recipe_id: 1,
	recipe_name: "Chocolate Banana Bread",
	category_id: 1,
	category_name: "Desserts",
	meal_id: 1,
	meal_name: "Breakfast",
	num_ratings: 12,
	overall_score: 4.8,
	prep_time_minutes: 15,
	cook_time_minutes: 45,
	total_time_minutes: 60,
	user_id: 11,
	recipe_description: "A soft banana bread with chocolate.",
	date_added: null,
	image_url: null,
	ingredients: ["Bananas", "Flour"],
	instructions: ["Mix ingredients", "Bake until done"],
};

test("authenticated user saves a recipe to a collection and removes it from Saved", async ({ page }) => {
	let collectionItems = [];
	await bootstrapTestAuth(page, undefined, "test-memory-collection-token");
	await page.route("**/recipes/1", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ recipe }) }));
	await page.route("**/recipes/1/reviews", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ reviews: [] }) }));
	await page.route("**/users/me/wishlist**", (route) => {
		const url = new URL(route.request().url());
		if (!url.searchParams.has("page")) {
			return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ wishlist: [{ recipe_id: 1 }] }) });
		}
		return route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				wishlist: [{ recipe, savedAt: "2026-08-23T06:30:00.000Z" }],
				pagination: { page: 1, limit: 12, total: 1, totalPages: 1, hasNext: false },
			}),
		});
	});
	await page.route("**/users/me/recipes/1/note", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ note: null }) }));
	await page.route("**/users/me/collections", async (route) => {
		if (route.request().method() === "POST") {
			return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ collection: { collection_id: 4, name: "Weeknight dinners", recipe_count: collectionItems.length } }) });
		}
		return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ collections: [{ collection_id: 4, name: "Weeknight dinners", recipe_count: collectionItems.length }] }) });
	});
	await page.route("**/users/me/collections/4/recipes", async (route) => {
		if (route.request().method() === "POST") {
			collectionItems = [recipe];
			return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ collection: { collection_id: 4, name: "Weeknight dinners", recipe_count: 1 } }) });
		}
		return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ recipes: collectionItems }) });
	});
	await page.route("**/users/me/collections/4/recipes/1", async (route) => {
		if (route.request().method() === "DELETE") {
			collectionItems = [];
			return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ message: "Recipe removed from collection" }) });
		}
		return route.fallback();
	});

	await page.goto("/recipe?id=1");
	await page.getByRole("button", { name: "Save to collection", exact: true }).click();
	await page.getByRole("button", { name: "Save to Weeknight dinners" }).click();
	await page.getByRole("button", { name: "Done" }).click();

	await page.goto("/saved");
	await page.getByRole("tab", { name: /Weeknight dinners/ }).click();
	await expect(page.getByText("Chocolate Banana Bread", { exact: true })).toBeVisible();
	await page.getByRole("button", { name: "Remove Chocolate Banana Bread" }).click();
	await page.getByRole("button", { name: "Remove", exact: true }).click();
	await expect(page.getByRole("heading", { name: "This collection is empty" })).toBeVisible();
});

test("Saved pagination keeps the current page, search, and sort in the URL", async ({ page }) => {
	const firstPageRecipe = { ...recipe, recipe_id: 11, recipe_name: "Banana Pancakes" };
	const secondPageRecipe = { ...recipe, recipe_id: 12, recipe_name: "Banana Oat Bowl" };
	const requestedPages = [];
	await bootstrapTestAuth(page, undefined, "test-saved-pagination-token");
	await page.route("**/users/me/collections", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ collections: [] }) }));
	await page.route("**/users/me/wishlist**", (route) => {
		const url = new URL(route.request().url());
		const requestedPage = Number(url.searchParams.get("page") || 1);
		requestedPages.push({
			page: requestedPage,
			search: url.searchParams.get("search"),
			sort: url.searchParams.get("sort"),
		});
		const selectedRecipe = requestedPage === 1 ? firstPageRecipe : secondPageRecipe;
		return route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				wishlist: [{ recipe: selectedRecipe, savedAt: "2026-08-23T06:30:00.000Z" }],
				pagination: { page: requestedPage, limit: 12, total: 25, totalPages: 3, hasNext: requestedPage < 3 },
			}),
		});
	});

	await page.goto("/wishlist?page=2&search=banana&sort=name");
	await expect(page.getByRole("heading", { name: "Saved Recipes", exact: true })).toBeVisible();
	await expect(page.getByLabel("Search")).toHaveValue("banana");
	await expect(page.getByLabel("Sort")).toHaveValue("name");
	await expect(page.getByText("Banana Oat Bowl", { exact: true })).toBeVisible();
	await expect(page.getByRole("status")).toContainText("Page 2 of 3");

	await page.getByRole("button", { name: "Previous page" }).click();
	await expect(page).toHaveURL(/\/wishlist\?page=1&search=banana&sort=name$/);
	await expect(page.getByText("Banana Pancakes", { exact: true })).toBeVisible();
	await expect.poll(() => requestedPages.at(-1)).toEqual({ page: 1, search: "banana", sort: "name" });

	await page.getByRole("button", { name: "Next page" }).click();
	await expect(page).toHaveURL(/\/wishlist\?page=2&search=banana&sort=name$/);
	await expect(page.getByText("Banana Oat Bowl", { exact: true })).toBeVisible();

	for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
		await page.setViewportSize(viewport);
		const pagination = page.getByRole("navigation", { name: "Saved recipe pages" });
		await expect(pagination).toBeVisible();
		await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
		for (const label of ["Previous page", "Next page"]) {
			const button = page.getByRole("button", { name: label });
			const box = await button.boundingBox();
			expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
		}
	}
});
