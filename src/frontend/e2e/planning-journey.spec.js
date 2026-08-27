import { expect, test } from "@playwright/test";
import { bootstrapTestAuth } from "./auth-fixtures";

const recipe = {
	recipe_id: 7,
	recipe_name: "Chicken Curry",
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
};

const json = (body, status = 200) => ({
	status,
	contentType: "application/json",
	body: JSON.stringify(body),
});

async function stubRecipeApi(page) {
	await page.route("**/recipes**", (route) =>
		route.fulfill(
			json({
				recipes: [recipe],
				pagination: {
					page: 1,
					limit: 100,
					total: 1,
					totalPages: 1,
					hasNext: false,
				},
			})
		)
	);
	await page.route("**/recipes/*", (route) =>
		route.fulfill(json({ recipe }))
	);
	await page.route("**/reviews", (route) =>
		route.fulfill(json({ reviews: [] }))
	);
}

async function authenticateAsTestUser(page) {
	await bootstrapTestAuth(page, undefined, "test-memory-planning-token");
	await page.route("**/users/me/wishlist", (route) =>
		route.fulfill(json({ wishlist: [{ recipe_id: recipe.recipe_id }] }))
	);
	await page.route("**/users/me/ratings", (route) =>
		route.fulfill(json({ ratings: [] }))
	);
	let cookingSession = null;
	await page.route("**/users/me/cooking-session**", async (route) => {
		const request = route.request();
		const url = new URL(request.url());
		const path = url.pathname.slice(url.pathname.indexOf("/users/me/cooking-session"));
		const method = request.method();

		if (method === "GET" && path === "/users/me/cooking-session") {
			return route.fulfill(json({ session: cookingSession }));
		}
		if (method === "POST" && path === "/users/me/cooking-session") {
			const body = JSON.parse(request.postData() || "{}");
			cookingSession = cookingSession
				? { ...cookingSession, status: "active", paused_at: null }
				: {
						session_id: 31,
						user_id: 7,
						recipe_id: body.recipeId,
						recipe_name: recipe.recipe_name,
						meal_plan_item_id: body.mealPlanItemId ?? null,
						planned_date: "2026-08-24",
						slot: "dinner",
						servings: body.servings ?? 1,
						current_step: 0,
						status: "active",
						started_at: "2026-08-24T17:00:00.000Z",
						last_active_at: "2026-08-24T17:00:00.000Z",
						paused_at: null,
						completed_at: null,
						created_at: "2026-08-24T17:00:00.000Z",
						updated_at: "2026-08-24T17:00:00.000Z",
					};
			return route.fulfill(json({ session: cookingSession }, 201));
		}
		if (method === "PATCH" && path === "/users/me/cooking-session/31") {
			const body = JSON.parse(request.postData() || "{}");
			cookingSession = { ...cookingSession, ...(body.currentStep === undefined ? {} : { current_step: body.currentStep }), ...(body.status ? { status: body.status } : {}) };
			return route.fulfill(json({ session: cookingSession }));
		}
		if (method === "POST" && path === "/users/me/cooking-session/31/complete") {
			cookingSession = { ...cookingSession, status: "completed", completed_at: "2026-08-24T17:35:00.000Z" };
			return route.fulfill(json({
				session: cookingSession,
				history: {
					history_id: 21,
					user_id: 7,
					recipe_id: recipe.recipe_id,
					recipe_name: recipe.recipe_name,
					meal_plan_item_id: cookingSession.meal_plan_item_id,
					planned_date: cookingSession.planned_date,
					slot: cookingSession.slot,
					servings: cookingSession.servings,
					started_at: cookingSession.started_at,
					completed_at: cookingSession.completed_at,
					created_at: cookingSession.completed_at,
				},
			}));
		}
		return route.fallback();
	});
	await page.route("**/users/me/cooking-history", async (route) => {
		if (route.request().method() === "POST") {
			const body = JSON.parse(route.request().postData() || "{}");
			return route.fulfill(json({
				item: {
					history_id: 21,
					recipe_id: body.recipeId,
					recipe_name: recipe.recipe_name,
					meal_plan_item_id: body.mealPlanItemId ?? null,
					planned_date: "2026-08-24",
					slot: "dinner",
					servings: body.servings ?? 1,
					started_at: "2026-08-24T17:00:00.000Z",
					completed_at: "2026-08-24T17:35:00.000Z",
					created_at: "2026-08-24T17:35:00.000Z",
				}
			}, 201));
		}
		return route.fulfill(json({ items: [] }));
	});
}

async function stubPlanningApi(page) {
	let plan = null;
	let item = null;

	await page.route("**/users/me/meal-plans**", async (route) => {
		const request = route.request();
		const url = new URL(request.url());
		const path = url.pathname.slice(url.pathname.indexOf("/users/me/meal-plans"));
		const method = request.method();

		if (method === "GET" && path === "/users/me/meal-plans") {
			return route.fulfill(json({ plans: plan ? [plan] : [] }));
		}

		if (method === "POST" && path === "/users/me/meal-plans") {
			const body = JSON.parse(request.postData() || "{}");
			plan = {
				plan_id: 12,
				name: body.name,
				start_date: body.from,
				end_date: body.to,
				created_at: "2026-08-24T00:00:00.000Z",
				updated_at: "2026-08-24T00:00:00.000Z",
			};
			return route.fulfill(json({ plan }, 201));
		}

		if (method === "GET" && path === "/users/me/meal-plans/12") {
			return route.fulfill(json({ plan, items: item ? [item] : [] }));
		}

		if (method === "POST" && path === "/users/me/meal-plans/12/items") {
			const body = JSON.parse(request.postData() || "{}");
			item = {
				item_id: 4,
				plan_id: 12,
				recipe_id: body.recipeId,
				recipe_name: recipe.recipe_name,
				planned_date: body.date,
				slot: body.slot,
				servings: body.servings,
				created_at: "2026-08-24T00:00:00.000Z",
			};
			return route.fulfill(json({ item }, 201));
		}

		if (method === "PATCH" && path === "/users/me/meal-plans/12/items/4") {
			const body = JSON.parse(request.postData() || "{}");
			item = { ...item, ...body, recipe_id: body.recipeId ?? item.recipe_id };
			return route.fulfill(json({ item }));
		}

		return route.fallback();
	});
}

test("authenticated user completes the planning-to-cooking journey", async ({ page }) => {
	await stubRecipeApi(page);
	await authenticateAsTestUser(page);
	await stubPlanningApi(page);

	await page.goto("/planning");
	await expect(page.getByRole("heading", { name: "Plan with intention" })).toBeVisible();
	await page.getByRole("button", { name: "Start a weekly plan" }).click();

	await expect(page.getByText("Week at a glance", { exact: true })).toBeVisible();
	const weekday = await page.getByRole("region", { name: "Weekly meal plan" }).getByRole("heading").first().innerText();

	await page.getByRole("button", { name: `Add recipe to ${weekday} dinner` }).click();
	await expect(page.getByRole("dialog", { name: "Add a meal to your plan" })).toBeVisible();
	await page.getByRole("button", { name: recipe.recipe_name }).click();
	await page.getByRole("button", { name: "Add to plan" }).click();

	await expect(page.getByRole("link", { name: `Open ${recipe.recipe_name}` })).toBeVisible();
	await page.getByRole("button", { name: `Change ${recipe.recipe_name}` }).click();
	await page.getByLabel("Servings").fill("6");
	await page.getByRole("button", { name: "Save changes" }).click();
	await expect(page.getByText("6 servings", { exact: true })).toBeVisible();

	await page.getByRole("link", { name: `Start cooking ${recipe.recipe_name}` }).click();
	await expect(page).toHaveURL(/\/recipe\/cooking\?id=7&planItemId=4/);
	await expect(page.getByText(`${weekday} · Dinner · 6 servings`, { exact: true })).toBeVisible();
	await page.getByRole("button", { name: "Next step" }).click();
	await page.getByRole("button", { name: "Finish cooking" }).click();
	await expect(page.getByRole("heading", { name: "Recipe complete" })).toBeVisible();
	await page.getByRole("button", { name: "Back to plan" }).click();
	await expect(page).toHaveURL(/\/planning$/);
	await expect(page.getByText("6 servings", { exact: true })).toBeVisible();
});

test("keeps planner layout usable across requested responsive breakpoints", async ({ page }) => {
	await stubRecipeApi(page);
	await authenticateAsTestUser(page);
	await stubPlanningApi(page);

	await page.setViewportSize({ width: 375, height: 800 });
	await page.goto("/planning");
	await page.getByRole("button", { name: "Start a weekly plan" }).click();
	await expect(page.getByRole("region", { name: "Weekly meal plan" })).toBeVisible();

	for (const width of [375, 768, 1024, 1440]) {
		await page.setViewportSize({ width, height: 900 });
		await page.goto("/planning");
		await expect(page.getByRole("region", { name: "Weekly meal plan" })).toBeVisible();

		const audit = await page.evaluate(() => {
			const planner = document.querySelector('main[aria-labelledby="planning-title"]');
			const grid = document.querySelector('[aria-label="Weekly meal plan"]');
			const controls = Array.from(document.querySelectorAll('main[aria-labelledby="planning-title"] button, main[aria-labelledby="planning-title"] a'));
			return {
				viewportWidth: window.innerWidth,
				documentWidth: document.documentElement.scrollWidth,
				gridColumns: grid ? getComputedStyle(grid).gridTemplateColumns.split(" ").length : 0,
				controlViolations: controls
					.filter((control) => {
						const box = control.getBoundingClientRect();
						return box.width < 44 || box.height < 44;
					})
					.map((control) => control.textContent?.trim() || control.getAttribute("aria-label")),
				plannerWidth: planner?.getBoundingClientRect().width ?? 0,
			};
		});

		expect(audit.documentWidth).toBeLessThanOrEqual(audit.viewportWidth);
		expect(audit.controlViolations).toEqual([]);
		expect(audit.plannerWidth).toBeLessThanOrEqual(width);
		expect(audit.gridColumns).toBe(width >= 1024 ? 7 : width >= 640 ? 2 : 1);
	}
});
