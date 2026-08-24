import { expect, test } from "@playwright/test";

const json = (body, status = 200) => ({
	status,
	contentType: "application/json",
	body: JSON.stringify(body),
});

async function stubFoodApi(page) {
	await page.route("**/recipes**", (route) => {
		const pathname = new URL(route.request().url()).pathname;
		if (!pathname.endsWith("/recipes")) return route.fallback();
		return route.fulfill(json({
			recipes: [{
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
			}],
			pagination: { page: 1, limit: 6, total: 1, totalPages: 1, hasNext: false },
		}));
	});
	await page.route("**/categories", (route) => route.fulfill(json({ categories: [{ id: 2, name: "Main Course" }] })));
	await page.route("**/meals", (route) => route.fulfill(json({ meals: [{ id: 3, name: "Dinner" }] })));
}

test("supports mobile filter sheet, URL chips, sort, and browser history", async ({ page }) => {
	await stubFoodApi(page);
	await page.setViewportSize({ width: 375, height: 900 });
	await page.goto("/food");

	await expect(page.getByRole("button", { name: "Filters (0)" })).toBeVisible();
	await page.getByRole("button", { name: "Filters (0)" }).click();
	const dialog = page.getByRole("dialog", { name: "Filter recipes" });
	await expect(dialog).toBeVisible();
	await dialog.getByRole("button", { name: "Main Course" }).click();
	await expect(page).toHaveURL(/categoryId=2/);
	await expect(dialog.getByRole("button", { name: "Dinner" })).toHaveCount(1);
	await dialog.getByRole("button", { name: "Dinner" }).click();
	await expect(page).toHaveURL(/mealId=3/);
	await dialog.getByLabel("Search recipes").fill("chicken");
	await dialog.getByRole("button", { name: "Done" }).click();

	await expect(page).toHaveURL(/\/food\?q=chicken&categoryId=2&mealId=3/);
	const activeFilters = page.getByLabel("Active recipe filters");
	await expect(activeFilters.getByText("Search: chicken", { exact: true })).toBeVisible();
	await expect(activeFilters.getByText("Main Course", { exact: true })).toBeVisible();
	await expect(activeFilters.getByText("Dinner", { exact: true })).toBeVisible();

	await page.getByRole("combobox", { name: "Sort" }).selectOption("rating");
	await expect(page).toHaveURL(/sort=rating/);

	await page.getByRole("button", { name: "Remove category filter" }).click();
	await expect(page).not.toHaveURL(/categoryId=2/);
	await page.goBack();
	await expect(page).toHaveURL(/categoryId=2/);
	await expect(page.getByLabel("Active recipe filters").getByText("Main Course", { exact: true })).toBeVisible();
	await page.goForward();
	await expect(page).not.toHaveURL(/categoryId=2/);

	await page.getByRole("button", { name: "Clear all" }).click();
	await expect(page).toHaveURL(/\/food\?sort=rating$/);
	await expect(page.getByRole("button", { name: "Filters (0)" })).toBeVisible();

	const audit = await page.evaluate(() => ({
		viewportWidth: window.innerWidth,
		documentWidth: document.documentElement.scrollWidth,
		controls: Array.from(document.querySelectorAll("button, input, select"))
			.map((element) => ({
				label: element.getAttribute("aria-label") || element.textContent?.trim(),
				width: element.getBoundingClientRect().width,
				height: element.getBoundingClientRect().height,
			}))
			.filter(({ width, height }) => width > 0 && height > 0),
	}));
	expect(audit.documentWidth).toBeLessThanOrEqual(audit.viewportWidth);
	expect(audit.controls.filter(({ width, height }) => width < 44 || height < 44)).toEqual([]);
});

test("keeps the desktop sidebar and hides the mobile trigger", async ({ page }) => {
	await stubFoodApi(page);
	await page.setViewportSize({ width: 1024, height: 900 });
	await page.goto("/food?categoryId=2");

	await expect(page.locator(".food__menubar")).toBeVisible();
	await expect(page.getByRole("button", { name: /Filters \(/ })).toBeHidden();
	await expect(page.getByRole("button", { name: "Clear all" })).toBeVisible();
});
