import { expect, test } from "@playwright/test";
import {
	findRecipeByName,
	loginApi,
	loginInBrowser,
	removeWishlistItem,
} from "./helpers.js";

test.describe.configure({ mode: "serial" });

test("real stack: discovers a seeded recipe through the public UI and opens its details", async ({ page, request }) => {
	const recipe = await findRecipeByName(request, "Avocado Toast with Chili");

	await page.goto(`/food?q=${encodeURIComponent(recipe.recipe_name)}`);
	await expect(page.getByRole("heading", { name: "Find something worth cooking" })).toBeVisible();
	const recipeLink = page.getByRole("link", { name: `Open ${recipe.recipe_name}` });
	await expect(recipeLink).toBeVisible();
	await recipeLink.click();

	await expect(page).toHaveURL(new RegExp(`/recipe\\?id=${recipe.recipe_id}$`));
	await expect(page.getByRole("heading", { name: recipe.recipe_name, exact: true })).toBeVisible();
});

test("real stack: logs in, saves a recipe, persists it across reload, and removes it", async ({ page, request }) => {
	const auth = await loginApi(request);
	const recipe = await findRecipeByName(request, "Avocado Toast with Chili");
	await removeWishlistItem(request, auth.headers, recipe.recipe_id);

	try {
		await loginInBrowser(page);
		await page.goto(`/recipe?id=${recipe.recipe_id}`);
		await expect(page.getByRole("button", { name: /Open account menu for/ })).toBeVisible();

		const saveButton = page.getByRole("button", { name: "Save recipe", exact: true });
		await expect(saveButton).toBeVisible();
		await expect(saveButton).toHaveAttribute("aria-pressed", "false");

		const addResponsePromise = page.waitForResponse((response) =>
			response.request().method() === "POST" && new URL(response.url()).pathname.endsWith("/users/me/wishlist"),
		{ timeout: 10000 },
		);
		await saveButton.click();
		const addResponse = await addResponsePromise;
		expect(addResponse.status()).toBe(201);
		await expect(page.getByRole("button", { name: "Remove recipe from saved" })).toHaveAttribute("aria-pressed", "true");

		await page.reload();
		await expect(page.getByRole("button", { name: "Remove recipe from saved" })).toHaveAttribute("aria-pressed", "true");

		const removeResponsePromise = page.waitForResponse((response) =>
			response.request().method() === "DELETE" && new URL(response.url()).pathname.endsWith(`/users/me/wishlist/${recipe.recipe_id}`),
		{ timeout: 10000 },
		);
		await page.getByRole("button", { name: "Remove recipe from saved" }).click();
		const removeResponse = await removeResponsePromise;
		expect(removeResponse.status()).toBe(200);
		await expect(page.getByRole("button", { name: "Save recipe", exact: true })).toHaveAttribute("aria-pressed", "false");
	} finally {
		await removeWishlistItem(request, auth.headers, recipe.recipe_id);
	}
});
