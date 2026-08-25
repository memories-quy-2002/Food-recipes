import { expect, test } from "@playwright/test";

const recipe = {
	recipe_id: 42,
	recipe_name: "Summer Pasta",
	category_id: 2,
	category_name: "Main Course",
	meal_id: 3,
	meal_name: "Dinner",
	num_ratings: 8,
	overall_score: 4.5,
	prep_time_minutes: 15,
	cook_time_minutes: 20,
	total_time_minutes: 35,
	servings: 4,
	user_id: 12,
	recipe_description: "A bright pasta dinner.",
	date_added: null,
	image_url: null,
	ingredients: ["Pasta", "Cherry tomatoes"],
	instructions: ["Boil the pasta.", "Toss with the tomatoes."],
	nutrition: { calories: 480, protein: 16 },
	private_notes: "Do not share this personal note.",
};

const json = (body) => ({
	status: 200,
	contentType: "application/json",
	body: JSON.stringify(body),
});

async function stubRecipeApi(page) {
	await page.route("**/recipes**", (route) => route.fulfill(json({
		recipes: [recipe],
		pagination: { page: 1, limit: 100, total: 1, totalPages: 1, hasNext: false },
	})));
	await page.route("**/recipes/42", (route) => route.fulfill(json({ recipe })));
	await page.route("**/recipes/42/reviews", (route) => route.fulfill(json({ reviews: [] })));
}

async function stubBrowserApis(page, { supportsShare, supportsClipboard = true }) {
	await page.addInitScript(({ supportsNativeShare, supportsClipboardApi }) => {
		Object.defineProperty(navigator, "share", {
			configurable: true,
			value: supportsNativeShare
				? async (payload) => {
					window.__recipeSharePayload = payload;
				}
				: undefined,
		});
		Object.defineProperty(navigator, "clipboard", {
			configurable: true,
			value: supportsClipboardApi
				? {
					writeText: async (text) => {
						window.__recipeClipboardText = text;
					},
				}
				: undefined,
		});
		window.print = () => {
			window.__recipePrintCalls = (window.__recipePrintCalls || 0) + 1;
		};
	}, { supportsNativeShare: supportsShare, supportsClipboardApi: supportsClipboard });
}

async function visitRecipe(page) {
	await stubRecipeApi(page);
	await page.goto(`/recipe?id=${recipe.recipe_id}`);
	await expect(page.getByRole("heading", { name: recipe.recipe_name })).toBeVisible();
}

function expectPublicRecipeUrl(url) {
	const sharedUrl = new URL(url);
	expect(sharedUrl.pathname).toBe("/recipe");
	expect(sharedUrl.searchParams.get("id")).toBe(String(recipe.recipe_id));
	expect([...sharedUrl.searchParams.keys()]).toEqual(["id"]);
	expect(sharedUrl.toString()).not.toContain(recipe.private_notes);
}

test("shares the public recipe URL with the native browser API", async ({ page }) => {
	await stubBrowserApis(page, { supportsShare: true });
	await visitRecipe(page);

	await page.getByRole("button", { name: "Share recipe" }).click();
	await page.waitForFunction(() => Boolean(window.__recipeSharePayload));

	const payload = await page.evaluate(() => window.__recipeSharePayload);
	expect(payload).toEqual({
		title: recipe.recipe_name,
		text: recipe.recipe_description,
		url: expect.any(String),
	});
	expectPublicRecipeUrl(payload.url);
	await expect(page.getByRole("status").filter({ hasText: "Recipe shared." })).toHaveText("Recipe shared.");
});

test("copies the public recipe URL when native sharing is unavailable", async ({ page }) => {
	await stubBrowserApis(page, { supportsShare: false });
	await visitRecipe(page);

	await page.getByRole("button", { name: "Share recipe" }).click();
	await page.waitForFunction(() => typeof window.__recipeClipboardText === "string");

	const copiedUrl = await page.evaluate(() => window.__recipeClipboardText);
	expectPublicRecipeUrl(copiedUrl);
	await expect(page.getByRole("status").filter({ hasText: "Recipe link copied to clipboard." })).toHaveText("Recipe link copied to clipboard.");
});

test("shows an actionable status when sharing and clipboard are unavailable", async ({ page }) => {
	await stubBrowserApis(page, { supportsShare: false, supportsClipboard: false });
	await visitRecipe(page);

	await page.getByRole("button", { name: "Share recipe" }).click();
	await expect(page.getByRole("status").filter({ hasText: "Sharing isn't available in this browser." })).toHaveText("Sharing isn't available in this browser.");
	await expect(page.getByRole("alert").filter({ hasText: "Sharing isn't available in this browser." })).toBeVisible();
});

test("invokes print and keeps recipe content printable at the mobile breakpoint", async ({ page }) => {
	await stubBrowserApis(page, { supportsShare: true });
	await page.setViewportSize({ width: 390, height: 844 });
	await visitRecipe(page);
	await expect(page).toHaveURL(/\/recipe\?id=42$/);
	await expect(page.getByRole("heading", { name: "Ingredients" })).toBeVisible();

	const screenLayout = await page.evaluate(() => ({
		viewportWidth: window.innerWidth,
		documentWidth: document.documentElement.scrollWidth,
	}));
	expect(screenLayout.documentWidth).toBeLessThanOrEqual(screenLayout.viewportWidth);

	await page.getByRole("button", { name: "Print recipe" }).click();
	await expect.poll(() => page.evaluate(() => window.__recipePrintCalls || 0)).toBe(1);
	await expect(page.getByRole("status").filter({ hasText: "Print dialog opened." })).toHaveText("Print dialog opened.");

	// Keep print-media assertions separate from the normal mobile layout check above.
	await page.emulateMedia({ media: "print" });
	const actionsAreHidden = await page.locator(".recipe-print__summary button, .recipe-print__summary a").evaluateAll(
		(controls) => controls.length > 0 && controls.every((control) => getComputedStyle(control).display === "none")
	);
	expect(actionsAreHidden).toBe(true);
	await expect(page.getByRole("heading", { name: recipe.recipe_name })).toBeVisible();
	await expect(page.getByRole("heading", { name: "Ingredients" })).toBeVisible();
	await expect(page.getByRole("heading", { name: "Nutrition per serving" })).toBeVisible();
	await expect(page.getByRole("heading", { name: "Instructions" })).toBeVisible();
});
