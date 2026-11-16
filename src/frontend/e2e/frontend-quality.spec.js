import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { bootstrapTestAuth } from "./auth-fixtures.js";

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
	await expect(page.getByRole("link", { name: recipe.recipe_name })).toBeVisible();
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
	await expect(menuButton).toBeFocused();
	expect(await page.locator("body").evaluate((body) => body.style.overflow)).toBe("");

	for (const width of [320, 375, 390, 768, 1024, 1440]) {
		await page.setViewportSize({ width, height: 900 });
		const layout = await page.evaluate(() => ({
			viewportWidth: document.documentElement.clientWidth,
			documentWidth: document.documentElement.scrollWidth,
		}));
		expect(layout.documentWidth, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(layout.viewportWidth);
	}
	await page.setViewportSize({ width: 390, height: 844 });
	await expect(page).toHaveScreenshot("recipe-discovery-mobile.png", { fullPage: true, animations: "disabled", maxDiffPixels: 32 });

	const results = await new AxeBuilder({ page })
		.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
		.analyze();
	const blockingViolations = results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact));
	expect(blockingViolations, formatViolations(blockingViolations)).toEqual([]);
});

test("an expired authenticated session returns to sign in with the protected destination preserved", async ({ page }) => {
	const state = { expired: false };
	const user = { user_id: 7, full_name: "Smoke User", email: "smoke@example.test" };
	await bootstrapTestAuth(page, user, "expiring-access-token");
	await page.route("**/auth/refresh", (route) =>
		state.expired
			? route.fulfill(json({ code: "REFRESH_TOKEN_INVALID", message: "Unauthenticated" }, 401))
			: route.fulfill(json({ token: "expiring-access-token", user })),
	);
	await page.route("**/households", (route) => route.fulfill(json({ households: [] })));
	await page.route("**/users/me/pantry**", (route) => {
		if (route.request().method() === "POST" && state.expired) {
			return route.fulfill(json({ code: "AUTH_REQUIRED", message: "Your session has expired." }, 401));
		}
		if (route.request().method() === "GET") return route.fulfill(json({ items: [] }));
		return route.fallback();
	});

	await page.goto("/pantry");
	await expect(page.getByRole("heading", { name: "Pantry", exact: true })).toBeVisible();
	state.expired = true;
	await page.getByRole("textbox", { name: "Pantry item" }).fill("must-not-be-written");
	await page.getByRole("spinbutton", { name: "Quantity" }).fill("1");
	await page.getByRole("combobox", { name: "Unit" }).selectOption("GRAM");
	const unauthorizedWrite = page.waitForResponse((response) =>
		response.request().method() === "POST" && new URL(response.url()).pathname.endsWith("/users/me/pantry"),
	);
	await page.getByRole("button", { name: "Add pantry item" }).click();
	expect((await unauthorizedWrite).status()).toBe(401);

	await expect(page).toHaveURL(/\/account\?signup=false$/);
	await expect(page.getByRole("status").filter({ hasText: "Sign in required" })).toBeVisible();
	const authIntent = JSON.parse(await page.evaluate(() => sessionStorage.getItem("food-recipes:auth-intent")));
	expect(authIntent).toMatchObject({ returnTo: "/pantry" });
});

test("mobile drawer closes after route changes and restores focus on Escape", async ({ page }) => {
	await stubCatalogApi(page);
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/food");

	const trigger = page.getByRole("button", { name: "Open navigation menu" });
	await trigger.focus();
	await page.keyboard.press("Enter");
	const dialog = page.getByRole("dialog", { name: "Menu" });
	await expect(dialog).toBeVisible();
	expect(await page.locator("body").evaluate((body) => body.style.overflow)).toBe("hidden");
	await page.keyboard.press("Escape");
	await expect(dialog).toBeHidden();
	await expect(trigger).toBeFocused();
	expect(await page.locator("body").evaluate((body) => body.style.overflow)).toBe("");

	await trigger.click();
	await page.getByRole("button", { name: "Login / Sign up" }).click();
	await expect(page).toHaveURL(/\/account\?signup=false/);
	await expect(dialog).toBeHidden();
});

test("desktop account and More disclosures expose keyboard-operable navigation links", async ({ page }) => {
	await stubCatalogApi(page);
	await bootstrapTestAuth(page);
	await page.route("**/users/me/households", (route) => route.fulfill(json({ households: [] })));
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/food");
	await expect(page.getByRole("button", { name: /Open account menu for Smoke User/ })).toBeVisible();

	const moreToggle = page.getByRole("button", { name: "More navigation" });
	await expect(moreToggle).toBeVisible();
	await moreToggle.focus();
	await page.keyboard.press("Enter");
	const shoppingLink = page.getByRole("link", { name: "Shopping list" });
	await expect(shoppingLink).toBeFocused();
	await page.keyboard.press("Escape");
	await expect(moreToggle).toBeFocused();
	await expect(page.getByRole("menu")).toHaveCount(0);
	await moreToggle.click();
	await page.getByRole("link", { name: "Shopping list" }).click();
	await expect(page).toHaveURL(/\/shopping-list$/);
	await expect(page.getByRole("link", { name: "Shopping list" })).toHaveCount(0);

	const accountToggle = page.getByRole("button", { name: /Open account menu for Smoke User/ });
	await accountToggle.click();
	await expect(page.getByRole("link", { name: "My profile" })).toBeVisible();
	await expect(page.getByRole("menu")).toHaveCount(0);
	await page.keyboard.press("Escape");
	await expect(accountToggle).toBeFocused();
	await accountToggle.click();
	await page.getByRole("link", { name: "My profile" }).click();
	await expect(page).toHaveURL(/\/profile$/);
	await expect(page.getByRole("link", { name: "My profile" })).toHaveCount(0);
});
