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
	await page.route("**/users/me/wishlist", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ wishlist: [{ recipe_id: 1 }] }) }));
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
	await page.getByRole("button", { name: "Save recipe to collection", exact: true }).click();
	await page.getByRole("button", { name: "Save to Weeknight dinners" }).click();
	await page.getByRole("button", { name: "Done" }).click();

	await page.goto("/saved");
	await page.getByRole("tab", { name: /Weeknight dinners/ }).click();
	await expect(page.getByText("Chocolate Banana Bread", { exact: true })).toBeVisible();
	await page.getByRole("button", { name: "Remove Chocolate Banana Bread" }).click();
	await page.getByRole("button", { name: "Remove", exact: true }).click();
	await expect(page.getByRole("heading", { name: "This collection is empty" })).toBeVisible();
});
