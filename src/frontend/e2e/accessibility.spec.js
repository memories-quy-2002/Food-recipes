import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

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
		prep_time_minutes: 15,
		cook_time_minutes: 45,
		total_time_minutes: 60,
		user_id: 11,
		recipe_description: "A soft banana bread with chocolate.",
		date_added: null,
		image_url: null,
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
		prep_time_minutes: 20,
		cook_time_minutes: 35,
		total_time_minutes: 55,
		user_id: 12,
		recipe_description: "A warmly spiced chicken dinner.",
		date_added: null,
		image_url: null,
		ingredients: ["Chicken", "Tomato"],
		instructions: ["Season chicken", "Cook until tender"],
	},
];

async function stubPublicApi(page) {
	await page.route("**/recipes**", (route) =>
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				recipes,
				pagination: {
					page: 1,
					limit: 100,
					total: recipes.length,
					totalPages: 1,
					hasNext: false,
				},
			}),
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
			body: JSON.stringify({
				categories: [
					{ id: 1, name: "Desserts" },
					{ id: 2, name: "Main Course" },
				],
			}),
		})
	);
	await page.route("**/meals", (route) =>
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				meals: [
					{ id: 1, name: "Breakfast" },
					{ id: 2, name: "Dinner" },
				],
			}),
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

const publicRoutes = [
	{ name: "Home", path: "/" },
	{ name: "Food", path: "/food" },
	{ name: "Recipe detail", path: "/recipe?id=1" },
	{ name: "Account", path: "/account?signup=false" },
	{ name: "About", path: "/about" },
	{ name: "News", path: "/news" },
];

const formatViolations = (violations) =>
	violations
		.map(
			({ id, impact, help, nodes }) =>
				`${impact}: ${id} - ${help} (${nodes.length} node${nodes.length === 1 ? "" : "s"})`
		)
		.join("\n");

test.beforeEach(async ({ page }) => {
	await stubPublicApi(page);
});

for (const route of publicRoutes) {
	test(`${route.name} has no serious accessibility violations`, async ({ page }) => {
		await page.goto(route.path);
		await expect(page.locator("#root")).toBeVisible();
		await page.waitForTimeout(200);

		const results = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
			.analyze();
		const blockingViolations = results.violations.filter((violation) =>
			["serious", "critical"].includes(violation.impact)
		);

		expect(
			blockingViolations,
			formatViolations(blockingViolations)
		).toEqual([]);

		const hasHorizontalOverflow = await page.evaluate(
			() =>
				document.documentElement.scrollWidth >
				document.documentElement.clientWidth
		);
		expect(hasHorizontalOverflow).toBe(false);
	});
}
