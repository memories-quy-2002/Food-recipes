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
	ingredients: ["2 eggs", "olive oil"],
	instructions: ["Season chicken", "Cook until tender"],
};

const json = (body, status = 200) => ({
	status,
	contentType: "application/json",
	body: JSON.stringify(body),
});

async function stubRecipeApi(page) {
	await page.route("**/recipes", (route) =>
		route.fulfill(json({ recipes: [recipe], pagination: { page: 1, limit: 100, total: 1, totalPages: 1, hasNext: false } }))
	);
	await page.route("**/recipes/*", (route) => route.fulfill(json({ recipe })));
	await page.route("**/reviews", (route) => route.fulfill(json({ reviews: [] })));
}

async function authenticateAsTestUser(page) {
	await bootstrapTestAuth(page, undefined, "test-memory-planning-token");
	await page.route("**/users/me/wishlist", (route) => route.fulfill(json({ wishlist: [] })));
	await page.route("**/users/me/ratings", (route) => route.fulfill(json({ ratings: [] })));
	await page.route("**/users/me/recipes/7/note", (route) => route.fulfill(json({ note: null })));
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
			if (cookingSession) {
				cookingSession = { ...cookingSession, status: "active", paused_at: null };
				return route.fulfill(json({ session: cookingSession }, 201));
			}
			const body = JSON.parse(request.postData() || "{}");
			cookingSession = {
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
		if (method === "DELETE") {
			cookingSession = null;
			return route.fulfill(json({ message: "Cooking session abandoned" }));
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
				},
			}, 201));
		}
		return route.fulfill(json({ items: [] }));
	});
}

async function stubPlanningApi(page, { initialPlan = false, partialPlan = false } = {}) {
	const state = {
		plan: initialPlan
			? {
					plan_id: 12,
					name: "This week",
					start_date: partialPlan ? "2026-08-25" : "2026-08-24",
					end_date: "2026-08-30",
					created_at: "2026-08-24T00:00:00.000Z",
					updated_at: "2026-08-24T00:00:00.000Z",
				}
			: null,
		item: null,
		createPayload: null,
		addPayload: null,
	};

	await page.route("**/users/me/meal-plans**", async (route) => {
		const request = route.request();
		const url = new URL(request.url());
		const path = url.pathname.slice(url.pathname.indexOf("/users/me/meal-plans"));
		const method = request.method();

		if (method === "GET" && path === "/users/me/meal-plans") {
			if (initialPlan && state.plan && !partialPlan) {
				state.plan.start_date = url.searchParams.get("from") || state.plan.start_date;
				state.plan.end_date = url.searchParams.get("to") || state.plan.end_date;
			}
			return route.fulfill(json({ plans: state.plan ? [state.plan] : [] }));
		}

		if (method === "POST" && path === "/users/me/meal-plans") {
			state.createPayload = JSON.parse(request.postData() || "{}");
			state.plan = {
				plan_id: 12,
				name: state.createPayload.name,
				start_date: state.createPayload.from,
				end_date: state.createPayload.to,
				created_at: "2026-08-24T00:00:00.000Z",
				updated_at: "2026-08-24T00:00:00.000Z",
			};
			return route.fulfill(json({ plan: state.plan, items: [] }, 201));
		}

		if (method === "GET" && path === "/users/me/meal-plans/12") {
			return route.fulfill(json({ plan: state.plan, items: state.item ? [state.item] : [] }));
		}

		if (method === "POST" && path === "/users/me/meal-plans/12/items") {
			state.addPayload = JSON.parse(request.postData() || "{}");
			state.item = {
				item_id: 4,
				plan_id: 12,
				recipe_id: state.addPayload.recipeId,
				recipe_name: recipe.recipe_name,
				planned_date: state.addPayload.date,
				slot: state.addPayload.slot,
				servings: state.addPayload.servings,
				created_at: "2026-08-24T00:00:00.000Z",
			};
			return route.fulfill(json({ item: state.item }, 201));
		}

		return route.fallback();
	});

	return state;
}

test("connects Recipe Detail to a new plan, Cooking Mode, and Back to plan", async ({ page }) => {
	await stubRecipeApi(page);
	await authenticateAsTestUser(page);
	const planningState = await stubPlanningApi(page);

	await page.goto(`/recipe?id=${recipe.recipe_id}`);
	await expect(page.getByRole("button", { name: "Add recipe to meal plan" })).toBeVisible();
	await page.getByRole("button", { name: "Add recipe to meal plan" }).click();
	const dialog = page.getByRole("dialog", { name: "Add Chicken Curry to your plan" });
	await expect(dialog).toBeVisible();
	const dialogStyles = await dialog.evaluate((element) => {
			const primary = element.querySelector("footer > button:last-child");
		return {
			background: getComputedStyle(element).backgroundColor,
			primaryBackground: primary ? getComputedStyle(primary).backgroundColor : "",
		};
	});
	expect(dialogStyles.background).not.toBe("rgba(0, 0, 0, 0)");
	expect(dialogStyles.primaryBackground).not.toBe("rgba(0, 0, 0, 0)");

	const selectedDate = await dialog.getByLabel("Date").inputValue();
	await dialog.getByLabel("Meal").selectOption("lunch");
	await dialog.getByLabel("Servings").fill("6");
	await dialog.getByRole("button", { name: "Add to plan", exact: true }).click();

	await expect(page.getByText("Added Chicken Curry to your plan", { exact: true })).toBeVisible();
	expect(planningState.createPayload).toMatchObject({ name: "This week" });
	expect(planningState.addPayload).toMatchObject({ recipeId: 7, date: selectedDate, slot: "lunch", servings: 6 });

	await page.goto("/planning");
	await expect(page.getByRole("link", { name: "Open Chicken Curry" })).toBeVisible();
	await page.getByRole("link", { name: "Start cooking Chicken Curry" }).click();
	await expect(page).toHaveURL(/\/recipe\/cooking\?id=7&planItemId=4/);
	await expect(page.getByText(/Lunch.*6 servings/)).toBeVisible();
	await page.getByRole("button", { name: "Next step" }).click();
	await page.getByRole("button", { name: "Finish cooking" }).click();
	await expect(page.getByRole("heading", { name: "Recipe complete" })).toBeVisible();
	await page.getByRole("button", { name: "Back to plan" }).click();
	await expect(page).toHaveURL(/\/planning$/);
	await expect(page.getByText("6 servings", { exact: true })).toBeVisible();
});

test("restores cooking progress after leaving and returning to the recipe", async ({ page }) => {
	await stubRecipeApi(page);
	await authenticateAsTestUser(page);

	await page.goto(`/recipe/cooking?id=${recipe.recipe_id}`);
	await expect(page.getByText("Step 1 of 2")).toBeVisible();
	await page.getByRole("button", { name: "Next step" }).click();
	await expect(page.getByText("Step 2 of 2")).toBeVisible();
	await page.getByRole("button", { name: "Pause and exit cooking" }).click();
	await expect(page).toHaveURL(/\/recipe\?id=7$/);

	await page.goto(`/recipe/cooking?id=${recipe.recipe_id}`);
	await expect(page.getByText("Step 2 of 2")).toBeVisible();
});

test("adds directly to an existing plan without creating a duplicate", async ({ page }) => {
	await stubRecipeApi(page);
	await authenticateAsTestUser(page);
	const planningState = await stubPlanningApi(page, { initialPlan: true });

	await page.goto(`/recipe?id=${recipe.recipe_id}`);
	await page.getByRole("button", { name: "Add recipe to meal plan" }).click();
	const dialog = page.getByRole("dialog", { name: "Add Chicken Curry to your plan" });
	await dialog.getByLabel("Meal").selectOption("breakfast");
	await dialog.getByRole("button", { name: "Add to plan", exact: true }).click();

	await expect(page.getByText("Added Chicken Curry to your plan", { exact: true })).toBeVisible();
	expect(planningState.createPayload).toBeNull();
	expect(planningState.addPayload).toMatchObject({ recipeId: 7, slot: "breakfast", servings: 4 });
});

test("creates a full target week when an overlapping plan misses the selected date", async ({ page }) => {
	await stubRecipeApi(page);
	await authenticateAsTestUser(page);
	const planningState = await stubPlanningApi(page, { initialPlan: true, partialPlan: true });

	await page.goto(`/recipe?id=${recipe.recipe_id}`);
	await page.getByRole("button", { name: "Add recipe to meal plan" }).click();
	const dialog = page.getByRole("dialog", { name: "Add Chicken Curry to your plan" });
	await dialog.getByLabel("Date").fill("2026-08-24");
	await dialog.getByRole("button", { name: "Add to plan", exact: true }).click();

	await expect(page.getByText("Added Chicken Curry to your plan", { exact: true })).toBeVisible();
	expect(planningState.createPayload).toMatchObject({ name: "This week", from: "2026-08-24", to: "2026-08-30" });
	expect(planningState.addPayload).toMatchObject({ recipeId: 7, date: "2026-08-24" });
});

test("sends guests to account before opening Add to plan", async ({ page }) => {
	await stubRecipeApi(page);

	await page.goto(`/recipe?id=${recipe.recipe_id}`);
	await page.getByRole("button", { name: "Add recipe to meal plan" }).click();

	await expect(page).toHaveURL(/\/account\?signup=false$/);
});

test("keeps Recipe Detail actions usable at mobile and desktop widths", async ({ page }) => {
	await stubRecipeApi(page);
	await authenticateAsTestUser(page);
	await stubPlanningApi(page, { initialPlan: true });

	for (const width of [375, 768, 1024, 1440]) {
		await page.setViewportSize({ width, height: 900 });
		await page.goto(`/recipe?id=${recipe.recipe_id}`);
		await expect(page.getByRole("heading", { name: "Chicken Curry" })).toBeVisible();

		const audit = await page.evaluate(() => {
			const actionGroup = document.querySelector('section[aria-labelledby="recipe-title"]');
			const controls = Array.from(actionGroup?.querySelectorAll("button, a") ?? []);
			return {
				viewportWidth: window.innerWidth,
				documentWidth: document.documentElement.scrollWidth,
				position: actionGroup ? getComputedStyle(actionGroup).position : "missing",
				controlViolations: controls
					.filter((control) => {
						const box = control.getBoundingClientRect();
						return box.width < 44 || box.height < 44;
					})
					.map((control) => control.textContent?.trim() || control.getAttribute("aria-label")),
			};
		});

		expect(audit.documentWidth).toBeLessThanOrEqual(audit.viewportWidth);
		expect(audit.controlViolations).toEqual([]);
		expect(audit.position).toBe("static");
	}
});
