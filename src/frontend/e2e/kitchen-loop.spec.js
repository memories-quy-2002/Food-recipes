import { expect, test } from "@playwright/test";
import { bootstrapTestAuth } from "./auth-fixtures";

const json = (body, status = 200) => ({
	status,
	contentType: "application/json",
	body: JSON.stringify(body),
});

const historyItem = {
	history_id: 21,
	recipe_id: 7,
	recipe_name: "Chicken Curry",
	meal_plan_item_id: 4,
	planned_date: "2026-08-24",
	slot: "dinner",
	servings: 6,
	started_at: "2026-08-24T17:00:00.000Z",
	completed_at: "2026-08-24T17:35:00.000Z",
	created_at: "2026-08-24T17:35:00.000Z",
};

async function authenticateAndStubLoop(page) {
	await bootstrapTestAuth(page, undefined, "test-memory-kitchen-loop-token");
	await page.route("**/users/me/cooking-history", (route) => route.fulfill(json({ items: [historyItem] })));
	await page.route("**/users/me/suggestions", async (route) => {
		if (route.request().method() !== "POST") return route.fallback();
		return route.fulfill(json({
			disclaimer: "Suggestions are based on your existing catalog.",
			source: "catalog",
			suggestions: [{ recipe_id: 8, recipe_name: "Coconut Rice", reason: "A good follow-up to your recent dinner." }],
		}));
	});
}

test("authenticated user can continue from cooking history to personalized suggestions", async ({ page }) => {
	await authenticateAndStubLoop(page);
	await page.goto("/history");

	await expect(page.getByRole("heading", { name: "Your cooking history" })).toBeVisible();
	await expect(page.getByText("Chicken Curry", { exact: true })).toBeVisible();
	await expect(page.getByText("Planned cook", { exact: true })).toBeVisible();
	await expect(page.getByRole("link", { name: "Cook again" })).toHaveAttribute("href", /planItemId=4/);

	await page.getByRole("button", { name: "Find suggestions" }).click();
	await expect(page.getByRole("link", { name: "Coconut Rice" })).toBeVisible();
	await page.screenshot({ path: "output/playwright/kitchen-history-desktop.png", fullPage: true });
});

test("history keeps primary actions usable at mobile and desktop widths", async ({ page }) => {
	await authenticateAndStubLoop(page);

	for (const width of [375, 1440]) {
		await page.setViewportSize({ width, height: 900 });
		await page.goto("/history");
		const audit = await page.evaluate(() => ({
			viewportWidth: window.innerWidth,
			documentWidth: document.documentElement.scrollWidth,
			controlViolations: Array.from(document.querySelectorAll("main a, main button, main input, main select"))
				.filter((control) => {
					const box = control.getBoundingClientRect();
					return box.width < 44 || box.height < 44;
				})
				.map((control) => control.textContent?.trim() || control.getAttribute("aria-label")),
		}));

		expect(audit.documentWidth).toBeLessThanOrEqual(audit.viewportWidth);
		expect(audit.controlViolations).toEqual([]);
	}
});
