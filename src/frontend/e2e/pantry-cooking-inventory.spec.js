import { expect, test } from "@playwright/test";
import { bootstrapTestAuth } from "./auth-fixtures";

const json = (body, status = 200) => ({
	status,
	contentType: "application/json",
	body: JSON.stringify(body),
});

const recipe = {
	recipe_id: 7,
	recipe_name: "Inventory Curry",
	category_id: 2,
	category_name: "Main Course",
	meal_id: 2,
	meal_name: "Dinner",
	num_ratings: 0,
	overall_score: 0,
	prep_time_minutes: 10,
	cook_time_minutes: 20,
	total_time_minutes: 30,
	user_id: 12,
	recipe_description: "A recipe used to verify inventory-aware cooking.",
	date_added: null,
	image_url: null,
	ingredients: ["rice"],
	instructions: ["Measure the rice", "Finish the curry"],
};

const makeCookingSession = (body) => ({
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
});

async function stubPantryApi(page, initialItems = [
	{ pantry_id: 1, user_id: 7, name: "rice", have: true, quantity: 300, unit: "GRAM" },
	{ pantry_id: 2, user_id: 7, name: "salt", have: false, quantity: 1, unit: "PIECE" },
]) {
	const state = { items: initialItems.map((item) => ({ ...item })), failCreate: false };

	await page.route("**/users/me/pantry**", async (route) => {
		const request = route.request();
		const url = new URL(request.url());
		const path = url.pathname.slice(url.pathname.indexOf("/users/me/pantry"));
		const method = request.method();

		if (method === "GET" && path === "/users/me/pantry") {
			return route.fulfill(json({ items: state.items }));
		}
		if (method === "POST" && path === "/users/me/pantry") {
			if (state.failCreate) return route.fulfill(json({ message: "Unable to add pantry item" }, 500));
			const body = JSON.parse(request.postData() || "{}");
			const item = { pantry_id: Math.max(0, ...state.items.map(({ pantry_id }) => pantry_id)) + 1, user_id: 7, ...body };
			state.items.push(item);
			return route.fulfill(json({ item }, 201));
		}

		const pantryId = Number(path.split("/").pop());
		const item = state.items.find((candidate) => candidate.pantry_id === pantryId);
		if (!item) return route.fulfill(json({ message: "Pantry item not found" }, 404));
		if (method === "PATCH") {
			Object.assign(item, JSON.parse(request.postData() || "{}"));
			return route.fulfill(json({ item }));
		}
		if (method === "DELETE") {
			state.items = state.items.filter((candidate) => candidate.pantry_id !== pantryId);
			return route.fulfill(json({ message: "Pantry item removed" }));
		}
		return route.fallback();
	});

	return state;
}

async function stubRecipeApi(page) {
	await page.route("**/recipes**", async (route) => {
		const pathname = new URL(route.request().url()).pathname;
		if (pathname.endsWith("/recipes/7")) return route.fulfill(json({ recipe }));
		if (pathname.endsWith("/recipes")) {
			return route.fulfill(json({ recipes: [recipe], pagination: { page: 1, limit: 100, total: 1, totalPages: 1, hasNext: false } }));
		}
		return route.fallback();
	});
	await page.route("**/reviews", (route) => route.fulfill(json({ reviews: [] })));
}

async function stubShoppingApi(page, store) {
	await page.route("**/users/me/shopping-list", async (route) => {
		if (route.request().method() === "GET") return route.fulfill(json({ items: store.items }));
		return route.fallback();
	});
	await page.route("**/users/me/shopping-list/items", async (route) => {
		if (route.request().method() !== "POST") return route.fallback();
		const body = JSON.parse(route.request().postData() || "{}");
		const item = { item_id: 100 + store.items.length, label: body.label, quantity: body.quantity ?? null, source_recipe_id: null, source_recipe_name: null, checked: false };
		store.items.push(item);
		return route.fulfill(json({ item }, 201));
	});
	await page.route("**/users/me/meal-plans**", (route) => route.fulfill(json({ plans: [], items: [] })));
}

async function stubAuthenticatedRecipe(page) {
	await bootstrapTestAuth(page, undefined, "test-inventory-browser-token");
	await page.route("**/users/me/wishlist", (route) => route.fulfill(json({ wishlist: [] })));
	await page.route("**/users/me/ratings", (route) => route.fulfill(json({ ratings: [] })));
	await page.route("**/users/me/recipes/7/note", (route) => route.fulfill(json({ note: null })));
}

async function stubCookingApi(page, mode = "shortage") {
	const state = { session: null, shoppingItems: [], completeBodies: [] };
	await stubAuthenticatedRecipe(page);
	await stubRecipeApi(page);
	await stubPantryApi(page);
	await stubShoppingApi(page, { get items() { return state.shoppingItems; }, set items(value) { state.shoppingItems = value; } });

	await page.route("**/users/me/cooking-session**", async (route) => {
		const request = route.request();
		const url = new URL(request.url());
		const path = url.pathname.slice(url.pathname.indexOf("/users/me/cooking-session"));
		const method = request.method();

		if (method === "GET" && path === "/users/me/cooking-session") return route.fulfill(json({ session: state.session }));
		if (method === "POST" && path === "/users/me/cooking-session") {
			state.session = state.session ? { ...state.session, status: "active", paused_at: null } : makeCookingSession(JSON.parse(request.postData() || "{}"));
			return route.fulfill(json({ session: state.session }, 201));
		}
		if (method === "PATCH" && path === "/users/me/cooking-session/31") {
			const body = JSON.parse(request.postData() || "{}");
			state.session = { ...state.session, ...(body.currentStep === undefined ? {} : { current_step: body.currentStep }), ...(body.status ? { status: body.status } : {}) };
			return route.fulfill(json({ session: state.session }));
		}
		if (method === "POST" && path === "/users/me/cooking-session/31/complete") {
			const body = JSON.parse(request.postData() || "{}");
			state.completeBodies.push(body);
			if (!body.action && mode === "shortage") {
				return route.fulfill(json({
					code: "COOKING_PANTRY_SHORTAGE",
					message: "Some ingredients are missing from your pantry",
					shortages: [{ position: 0, ingredient_name: "rice", required_quantity: 500, required_unit: "GRAM", available_quantity: 300, missing_quantity: 200, pantry_id: 1 }],
				}, 409));
			}
			if (!body.action && mode === "invalid") {
				return route.fulfill(json({ code: "COOKING_RECIPE_INGREDIENTS_UNQUANTIFIED", message: "Recipe ingredients need quantities" }, 400));
			}
			if (!body.action && mode === "server-error") return route.fulfill(json({ message: "Database unavailable" }, 500));
			if (body.action === "shopping") {
				state.shoppingItems = [{ item_id: 101, label: "rice", quantity: "200 g", source_recipe_id: recipe.recipe_id, source_recipe_name: recipe.recipe_name, checked: false }];
				return route.fulfill(json({ status: "shopping_list_updated", session: state.session, shortages: [{ position: 0, ingredient_name: "rice", required_quantity: 500, required_unit: "GRAM", available_quantity: 300, missing_quantity: 200, pantry_id: 1 }], added_shopping_items: 1 }));
			}
			state.session = { ...state.session, status: "completed", completed_at: "2026-08-24T17:35:00.000Z" };
			return route.fulfill(json({ session: state.session, history: { history_id: 21, user_id: 7, recipe_id: recipe.recipe_id, recipe_name: recipe.recipe_name, meal_plan_item_id: state.session.meal_plan_item_id, planned_date: state.session.planned_date, slot: state.session.slot, servings: state.session.servings, started_at: state.session.started_at, completed_at: state.session.completed_at, created_at: state.session.completed_at } }));
		}
		return route.fallback();
	});

	return state;
}

async function openLastCookingStep(page) {
	await page.goto("/recipe/cooking?id=7&planItemId=4&date=2026-08-24&slot=dinner&servings=1&returnTo=%2Fplanning");
	await expect(page.getByRole("heading", { name: recipe.recipe_name })).toBeVisible();
	await expect(page.getByRole("button", { name: "Next step" })).toBeEnabled();
	await page.getByRole("button", { name: "Next step" }).click();
	await expect(page.getByRole("button", { name: "Finish cooking" })).toBeEnabled();
}

test("Pantry route loads without console errors and remains usable at mobile and desktop widths", async ({ page }, testInfo) => {
	const consoleErrors = [];
	page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
	page.on("pageerror", (error) => consoleErrors.push(error.message));
	await bootstrapTestAuth(page);
	await stubPantryApi(page);
	await stubRecipeApi(page);

	for (const width of [375, 1440]) {
		await page.setViewportSize({ width, height: 900 });
		await page.goto("/pantry");
		await page.waitForLoadState("networkidle");
		await expect(page.getByRole("heading", { name: "Know what you already have" })).toBeVisible();
		const audit = await page.evaluate(() => ({ viewportWidth: window.innerWidth, documentWidth: document.documentElement.scrollWidth, overlayCount: document.querySelectorAll('[role="dialog"][aria-modal="true"]').length }));
		expect(audit.documentWidth).toBeLessThanOrEqual(audit.viewportWidth);
		expect(audit.overlayCount).toBe(0);
	}
	await page.screenshot({ path: testInfo.outputPath("pantry-route.png"), fullPage: true });
	expect(consoleErrors).toEqual([]);
});

test("user validates, adds, edits, moves, deletes, and handles a failed Pantry mutation", async ({ page }) => {
	await bootstrapTestAuth(page);
	const pantry = await stubPantryApi(page);
	await page.goto("/pantry");
	await expect(page.getByRole("heading", { name: "Already have" })).toBeVisible();

	await page.getByRole("button", { name: "Add pantry item" }).click();
	await expect(page.getByRole("alert")).toHaveText("Add an item name before saving.");
	await page.getByRole("textbox", { name: "Pantry item" }).fill("flour");
	await page.getByRole("button", { name: "Add pantry item" }).click();
	await expect(page.getByRole("alert")).toHaveText("Add a valid quantity before saving.");

	await page.getByRole("spinbutton", { name: "Quantity" }).fill("200");
	await page.getByRole("combobox", { name: "Unit" }).selectOption("GRAM");
	await page.getByRole("button", { name: "Add pantry item" }).click();
	await expect(page.getByText("flour", { exact: true })).toBeVisible();
	await expect(page.getByText("200 g", { exact: true })).toBeVisible();

	await page.getByRole("button", { name: "Edit flour" }).click();
	const editForm = page.getByRole("form", { name: "Edit flour" });
	await editForm.getByRole("spinbutton").fill("0.5");
	await editForm.getByRole("combobox").selectOption("KILOGRAM");
	await editForm.getByRole("button", { name: "Save flour" }).click();
	await expect(page.getByText("0.5 kg", { exact: true })).toBeVisible();

	await page.getByRole("checkbox", { name: "flour available" }).click();
	await expect(page.getByRole("checkbox", { name: "flour available" })).not.toBeChecked();
	await expect(page.getByRole("heading", { name: "Need to get" })).toBeVisible();

	await page.getByRole("button", { name: "Delete flour" }).click();
	await expect(page.getByText("flour", { exact: true })).toHaveCount(0);

	pantry.failCreate = true;
	await page.getByRole("textbox", { name: "Pantry item" }).fill("beans");
	await page.getByRole("spinbutton", { name: "Quantity" }).fill("1");
	await page.getByRole("button", { name: "Add pantry item" }).click();
	await expect(page.locator('main[aria-labelledby="pantry-title"] [role="alert"]')).toHaveText("We could not add that pantry item. Try again.");
});

test("cooking shortage shows exact missing quantity and Continue anyway completes without shopping handoff", async ({ page }) => {
	const state = await stubCookingApi(page, "shortage");
	await openLastCookingStep(page);
	await page.getByRole("button", { name: "Finish cooking" }).click();
	await expect(page.getByRole("dialog", { name: "Some ingredients are missing" })).toBeVisible();
	await expect(page.getByText("missing 200 g", { exact: false })).toBeVisible();
	await page.getByRole("button", { name: "Continue anyway" }).click();
	await expect(page.getByRole("heading", { name: "Recipe complete" })).toBeVisible();
	await expect(state.completeBodies).toEqual([{}, { action: "complete" }]);
	await expect(state.shoppingItems).toEqual([]);
});

test("cooking shortage keeps the session active and sends only the missing amount to Shopping List", async ({ page }) => {
	const state = await stubCookingApi(page, "shortage");
	await openLastCookingStep(page);
	await page.getByRole("button", { name: "Finish cooking" }).click();
	await expect(page.getByRole("dialog", { name: "Some ingredients are missing" })).toBeVisible();
	await page.getByRole("button", { name: "Stop and add to shopping list" }).click();
	await expect(page.locator('main[aria-labelledby="cooking-mode-title"] [role="status"]')).toContainText("The missing ingredients were added to your shopping list. Your pantry was not changed.");
	await expect(page.getByRole("heading", { name: "Recipe complete" })).toHaveCount(0);
	await expect(state.completeBodies).toEqual([{}, { action: "shopping" }]);

	await page.getByRole("link", { name: "Open shopping list" }).click();
	await expect(page).toHaveURL(/\/shopping-list$/);
	await expect(page.getByRole("heading", { name: "Shopping List" })).toBeVisible();
	const riceItem = page.locator(".shopping-list__item").filter({ hasText: "rice" });
	await expect(riceItem).toBeVisible();
	await expect(riceItem).toContainText("200 g");
});

test("cooking reports actionable validation failure instead of falsely completing", async ({ page }) => {
	const invalidState = await stubCookingApi(page, "invalid");
	await openLastCookingStep(page);
	await page.getByRole("button", { name: "Finish cooking" }).click();
	await expect(page.getByRole("alert")).toHaveText("This recipe needs a positive quantity and supported unit for every ingredient before it can be completed.");
	await expect(page.getByRole("heading", { name: "Recipe complete" })).toHaveCount(0);
	await expect(invalidState.completeBodies).toEqual([{}]);
});

test("cooking reports a recoverable server failure instead of falsely completing", async ({ page }) => {
	const state = await stubCookingApi(page, "server-error");
	await openLastCookingStep(page);
	await page.getByRole("button", { name: "Finish cooking" }).click();
	await expect(page.getByRole("alert")).toHaveText("We could not save this cook yet. Try finishing again.");
	await expect(page.getByRole("heading", { name: "Recipe complete" })).toHaveCount(0);
	await expect(state.completeBodies).toEqual([{}]);
});
