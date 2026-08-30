import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const recipe = {
	recipe_id: 7,
	recipe_name: "Chicken Curry",
	category_id: 2,
	category_name: "Main Course",
	meal_id: 3,
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
};

const json = (body, status = 200) => ({
	status,
	contentType: "application/json",
	body: JSON.stringify(body),
});

const recipeList = (limit = 12) => ({
	recipes: [recipe],
	pagination: { page: 1, limit, total: 1, totalPages: 1, hasNext: false },
});

async function stubCatalogApi(page, options = {}) {
	const state = { allowDiscovery: !options.failDiscovery };

	await page.route("**/auth/refresh", (route) => route.fulfill(json({ statusCode: 401, message: "Refresh token is required" }, 401)));
	await page.route("**/recipes**", (route) => {
		const url = new URL(route.request().url());
		if (!url.pathname.endsWith("/recipes")) return route.fallback();
		const isDiscoveryRequest = url.searchParams.has("sort");
		if (isDiscoveryRequest && !state.allowDiscovery) {
			return route.fulfill(json({ statusCode: 503, message: "The recipe catalog is temporarily unavailable." }, 503));
		}
		const limit = Number(url.searchParams.get("limit") || (isDiscoveryRequest ? 12 : 100));
		return route.fulfill(json(recipeList(limit)));
	});
	await page.route("**/categories", (route) => route.fulfill(json({ categories: [{ id: 2, name: "Main Course", recipe_count: 1 }] })));
	await page.route("**/meals", (route) => route.fulfill(json({ meals: [{ id: 3, name: "Dinner" }] })));
	await page.route("**/home-feed", (route) => route.fulfill(json({ sections: [] })));

	return {
		allowDiscovery: () => {
			state.allowDiscovery = true;
		},
	};
}

const formatViolations = (violations) => violations
	.map(({ id, impact, help, nodes }) => `${impact}: ${id} - ${help} (${nodes.length} node${nodes.length === 1 ? "" : "s"})`)
	.join("\n");

test("recipe discovery exposes a retryable error and recovers after the catalog returns", async ({ page }) => {
	const catalog = await stubCatalogApi(page, { failDiscovery: true });
	await page.goto("/food");

	await expect(page.getByRole("heading", { name: "Recipe library could not load" })).toBeVisible();
	const retryButton = page.getByRole("button", { name: "Try again" });
	await expect(retryButton).toBeVisible();

	catalog.allowDiscovery();
	await retryButton.click();
	await expect(page.getByRole("link", { name: `Open ${recipe.recipe_name}` })).toBeVisible();
});

test("food discovery stays keyboard reachable, within the viewport, and accessible on mobile", async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await stubCatalogApi(page);
	await page.goto("/food");
	await expect(page.getByRole("heading", { name: "Find something worth cooking" })).toBeVisible();

	const overflow = await page.evaluate(() => ({
		documentWidth: document.documentElement.scrollWidth,
		viewportWidth: document.documentElement.clientWidth,
	}));
	expect(overflow.documentWidth).toBeLessThanOrEqual(overflow.viewportWidth);

	for (const name of ["Open navigation menu", "Filters", "Grid view", "List view"]) {
		const button = page.getByRole("button", { name });
		await expect(button).toBeVisible();
		const box = await button.boundingBox();
		expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
		expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
	}

	const menuButton = page.getByRole("button", { name: "Open navigation menu" });
	await menuButton.focus();
	await page.keyboard.press("Enter");
	const menu = page.getByRole("dialog", { name: "Menu" });
	await expect(menu).toBeVisible();
	await expect(page.getByRole("button", { name: "Close navigation menu" }).last()).toBeFocused();
	await page.keyboard.press("Escape");
	await expect(menu).toBeHidden();

	const results = await new AxeBuilder({ page })
		.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
		.analyze();
	const blockingViolations = results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact));
	expect(blockingViolations, formatViolations(blockingViolations)).toEqual([]);
});
