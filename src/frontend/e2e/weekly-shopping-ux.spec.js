import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { bootstrapTestAuth } from "./auth-fixtures.js";

const json = (body, status = 200) => ({ status, contentType: "application/json", body: JSON.stringify(body) });

async function setupWeeklyShopping(page, { viewer = false, incomplete = false, weekFrom = "2026-11-09", weekTo = "2026-11-15" } = {}) {
	await page.clock.setFixedTime(new Date("2026-11-15T07:00:00.000Z"));
	await bootstrapTestAuth(page);
	if (viewer) await page.addInitScript(() => localStorage.setItem("food-recipes:kitchen-scope", "household:42"));
	const scope = viewer ? "/households/42" : "/users/me";
	const state = { confirmed: 0, items: [{ item_id: 1, label: "Bananas", quantity: "2 pcs", checked: false, source_recipe_id: null, source_recipe_name: null }] };
	const plan = { plan_id: 9, name: "Week", start_date: weekFrom, end_date: weekTo };
	await page.route("**/households", route => route.fulfill(json({ households: viewer ? [{ household_id: 42, name: "Family kitchen", role: "VIEWER" }] : [] })));
	await page.route(`**${scope}/meal-plans**`, route => {
		const path = new URL(route.request().url()).pathname;
		if (path.endsWith("/meal-plans")) return route.fulfill(json({ plans: [plan] }));
		return route.fulfill(json({ plan, items: [] }));
	});
	await page.route(`**${scope}/pantry`, route => route.fulfill(json({ items: [] })));
	await page.route(`**${scope}/shopping-list**`, route => {
		const { pathname } = new URL(route.request().url());
		const method = route.request().method();
		if (pathname.endsWith("/weekly-preview") && method === "POST") {
			const { from, to } = route.request().postDataJSON();
			return route.fulfill(json({
				planId: 9, from, to, snapshot: "a".repeat(64), mealCount: 2,
				needsDetails: ["Salt"], skippedRecipes: incomplete ? [41] : [],
				items: [{ name: "Rice", unit: "GRAM", requiredQuantity: 800, availableQuantity: 200, missingQuantity: 600,
					quantity: "600 g", sourceRecipeId: 7, alreadyListed: state.items.some(item => item.label === "Rice") }],
			}));
		}
		if (pathname.endsWith("/weekly-confirm") && method === "POST") {
			state.confirmed++;
			if (!state.items.some(item => item.label === "Rice")) {
				state.items.push({ item_id: 2, label: "Rice", quantity: "600 g", checked: false, source_recipe_id: 7, source_recipe_name: "Rice Bowl" });
			}
			return route.fulfill(json({ addedShoppingItems: 1, items: [] }));
		}
		if (pathname.endsWith("/shopping-list") && method === "GET") return route.fulfill(json({ items: state.items }));
		return route.fulfill(json({ code: "NOT_FOUND" }, 404));
	});
	return state;
}

test("weekly shopping review stays accessible and responsive on mobile and desktop", async ({ page }) => {
	const state = await setupWeeklyShopping(page);
	for (const width of [320, 390, 768, 1440]) {
		await page.setViewportSize({ width, height: 850 });
		await page.goto("/shopping-list");
		await page.getByRole("button", { name: "Preview weekly ingredients" }).click();
		await expect(page.getByRole("table", { name: "Ingredients required for the selected week" })).toBeVisible();
		await expect(page.getByRole("columnheader", { name: "In pantry" })).toHaveCount(1);
		await expect(page.getByRole("cell", { name: /600 g to buy/ })).toBeVisible();
		const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
		expect(overflow, `Horizontal overflow at ${width}px`).toBe(false);
		if (width === 390 || width === 1440) {
			await page.screenshot({ path: `output/playwright/weekly-shopping-${width}.png`, fullPage: true });
		}
	}
	const a11y = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
	expect(a11y.violations, JSON.stringify(a11y.violations.map(v => ({ id: v.id, nodes: v.nodes.length })))).toEqual([]);
	await page.getByRole("button", { name: "Confirm & add missing items" }).click();
	await expect(page.getByText("1 weekly ingredient added to your shopping list.")).toBeVisible();
	await page.getByRole("button", { name: "Preview weekly ingredients" }).click();
	await expect(page.getByText("Already on your list")).toBeVisible();
	await expect(page.getByRole("button", { name: "Confirm & add missing items" })).toBeDisabled();
	expect(state.confirmed).toBe(1);
});

test("incomplete preview cannot be confirmed without an explicit acknowledgement", async ({ page }) => {
	const state = await setupWeeklyShopping(page, { incomplete: true });
	await page.goto("/shopping-list");
	await page.getByRole("button", { name: "Preview weekly ingredients" }).click();
	await expect(page.getByText(/Incomplete shopping estimate/)).toBeVisible();
	const confirm = page.getByRole("button", { name: "Confirm & add missing items" });
	await expect(confirm).toBeDisabled();
	expect(state.confirmed).toBe(0);
	await page.getByRole("checkbox", { name: /I understand this list is incomplete/ }).check();
	await expect(confirm).toBeEnabled();
	await confirm.click();
	await expect(page.getByText("1 weekly ingredient added to your shopping list.")).toBeVisible();
	expect(state.confirmed).toBe(1);
});

test("household viewer may preview weekly requirements but cannot confirm", async ({ page }) => {
	const state = await setupWeeklyShopping(page, { viewer: true });
	await page.goto("/shopping-list");
	await expect(page.getByText("You have read-only access to this kitchen.")).toBeVisible();
	await page.getByRole("button", { name: "Preview weekly ingredients" }).click();
	await expect(page.getByRole("table", { name: "Ingredients required for the selected week" })).toBeVisible();
	await expect(page.getByRole("button", { name: "Confirm & add missing items" })).toHaveCount(0);
	expect(state.confirmed).toBe(0);
});

test("shopping keeps the week selected in the meal planner", async ({ page }) => {
	await setupWeeklyShopping(page, { weekFrom: "2026-11-16", weekTo: "2026-11-22" });
	await page.goto("/shopping-list?week=2026-11-16");
	await expect(page.getByText("2026-11-16 – 2026-11-22")).toBeVisible();
	await page.getByRole("button", { name: "Preview weekly ingredients" }).click();
	await expect(page.getByRole("table", { name: "Ingredients required for the selected week" })).toBeVisible();
});
