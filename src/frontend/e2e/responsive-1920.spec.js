import { expect, test } from "@playwright/test";

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

const json = (body) => ({
	status: 200,
	contentType: "application/json",
	body: JSON.stringify(body),
});

async function stubCatalogApi(page) {
	await page.route("**/recipes**", (route) => {
		const url = new URL(route.request().url());
		if (!url.pathname.endsWith("/recipes")) return route.fallback();
		const limit = Number(url.searchParams.get("limit") || 100);
		return route.fulfill(json({
			recipes: [recipe],
			pagination: { page: 1, limit, total: 1, totalPages: 1, hasNext: false },
		}));
	});
	await page.route("**/categories", (route) => route.fulfill(json({
		categories: [{ id: 2, name: "Main Course", recipe_count: 1 }],
	})));
	await page.route("**/meals", (route) => route.fulfill(json({
		meals: [{ id: 3, name: "Dinner" }],
	})));
	await page.route("**/home-feed", (route) => route.fulfill(json({ sections: [] })));
}

async function auditDesktopViewport(page) {
	return page.evaluate(() => {
		const offenders = Array.from(document.querySelectorAll("*"))
			.map((element) => {
				const rect = element.getBoundingClientRect();
				return {
					tag: element.tagName,
					text: (element.textContent || "").trim().slice(0, 80),
					left: rect.left,
					right: rect.right,
					width: rect.width,
				};
			})
			.filter(({ width, left, right }) => width > 0 && (left < -1 || right > window.innerWidth + 1));
		const controls = Array.from(document.querySelectorAll("button, input, select, textarea"))
			.map((element) => {
				const rect = element.getBoundingClientRect();
				return { width: rect.width, height: rect.height };
			})
			.filter(({ width, height }) => width > 0 && height > 0);
		return {
			viewportWidth: window.innerWidth,
			viewportHeight: window.innerHeight,
			documentWidth: document.documentElement.scrollWidth,
			offenders,
			undersizedControls: controls.filter(({ width, height }) => width < 44 || height < 44),
		};
	});
}

test.describe("1920x1080 responsive layout", () => {
	test.use({ viewport: { width: 1920, height: 1080 } });

	test("keeps Home within the desktop canvas", async ({ page }) => {
		await stubCatalogApi(page);
		await page.goto("/");

		await expect(page.getByRole("region", { name: "Featured meals" })).toBeVisible();
		const audit = await auditDesktopViewport(page);

		expect(audit.viewportWidth).toBe(1920);
		expect(audit.viewportHeight).toBe(1080);
		expect(audit.documentWidth).toBeLessThanOrEqual(audit.viewportWidth);
		expect(audit.offenders).toEqual([]);
		expect(audit.undersizedControls).toEqual([]);
	});

	test("uses full desktop navigation and a bounded recipe workspace", async ({ page }) => {
		await stubCatalogApi(page);
		await page.goto("/food");

		await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
		await expect(page.getByRole("button", { name: "Open navigation menu" })).toBeHidden();
		await expect(page.getByRole("heading", { name: "Find something worth cooking" })).toBeVisible();

		const audit = await auditDesktopViewport(page);
		const workspaceWidth = await page.locator("main > div").evaluate((element) => element.getBoundingClientRect().width);

		expect(audit.documentWidth).toBeLessThanOrEqual(audit.viewportWidth);
		expect(audit.offenders).toEqual([]);
		expect(workspaceWidth).toBeLessThanOrEqual(1536);
	});
});
