import { expect, test } from "@playwright/test";
import {
	apiUrl,
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
	const recipeLink = page.getByRole("link", { name: recipe.recipe_name });
	await expect(recipeLink).toBeVisible();
	await recipeLink.click();

	await expect(page).toHaveURL(new RegExp(`/recipe\\?id=${recipe.recipe_id}$`));
	await expect(page.getByRole("heading", { name: recipe.recipe_name, exact: true })).toBeVisible();
});

test("real stack: finds recipes by a pantry ingredient and exposes public Recipe JSON-LD", async ({ page, request }) => {
	const recipe = await findRecipeByName(request, "Avocado Toast with Chili");
	const ingredientSearch = page.waitForRequest((candidate) => {
		const url = new URL(candidate.url());
		return url.pathname.endsWith("/recipes") && url.searchParams.get("ingredient") === "Avocado";
	});

	await page.goto("/food?pantryIngredient=Avocado");
	await ingredientSearch;
	await expect(page.getByRole("link", { name: recipe.recipe_name })).toBeVisible();
	await page.getByRole("link", { name: recipe.recipe_name }).click();

	const schemaNode = page.locator('script[type="application/ld+json"]');
	await expect(schemaNode).toHaveCount(1);
	const schema = await schemaNode.evaluate((node) => JSON.parse(node.textContent || "{}"));
	expect(schema).toMatchObject({ "@type": "Recipe", name: recipe.recipe_name });
	expect(schema.recipeIngredient.join(" ").toLowerCase()).toContain("avocado");
	await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/recipe\?id=\d+$/);
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

		const query = new URLSearchParams({ page: "1", limit: "1", search: recipe.recipe_name, sort: "name" });
		const paginatedResponse = await request.get(apiUrl(`/users/me/wishlist?${query}`), { headers: auth.headers });
		await expect(paginatedResponse, "paginated Saved request failed").toBeOK();
		const paginatedWishlist = await paginatedResponse.json();
		expect(paginatedWishlist.wishlist).toHaveLength(1);
		expect(paginatedWishlist.wishlist[0].recipe.recipe_id).toBe(recipe.recipe_id);
		expect(paginatedWishlist.pagination).toMatchObject({ page: 1, limit: 1, total: 1, totalPages: 1, hasNext: false });

		const legacyResponse = await request.get(apiUrl("/users/me/wishlist"), { headers: auth.headers });
		await expect(legacyResponse, "legacy Saved request failed").toBeOK();
		const legacyWishlist = await legacyResponse.json();
		expect(legacyWishlist.pagination).toBeUndefined();
		expect(legacyWishlist.wishlist.some((item) => item.recipe?.recipe_id === recipe.recipe_id || item.recipe_id === recipe.recipe_id)).toBe(true);

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
