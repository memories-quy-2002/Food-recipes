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
}

test("authenticated user can continue from cooking history to cooking again", async ({ page }) => {
	await authenticateAndStubLoop(page);
	await page.goto("/history");

	await expect(page.getByRole("heading", { name: "Your cooking history" })).toBeVisible();
	await expect(page.getByText("Chicken Curry", { exact: true })).toBeVisible();
	await expect(page.getByText("Planned cook", { exact: true })).toBeVisible();
	await expect(page.getByRole("link", { name: "Cook again" })).toHaveAttribute("href", /planItemId=4/);

	await expect(page.getByRole("button", { name: "Find suggestions" })).toHaveCount(0);
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

const fullFlowRecipe = {
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
	full_name: "Recipe Author",
	recipe_description: "A warmly spiced chicken dinner.",
	date_added: null,
	image_url: null,
	ingredients: ["2 kg rice"],
	instructions: ["Rinse the rice", "Cook until tender"],
};

const fullFlowJson = (body, status = 200) => ({
	status,
	contentType: "application/json",
	body: JSON.stringify(body),
});

async function stubFullKitchenLoop(page) {
	await bootstrapTestAuth(page, undefined, "test-memory-p0-e-kitchen-loop-token");
	const state = {
		plan: null,
		planItem: null,
		shoppingItems: [],
		pantryItems: [],
		nextShoppingItemId: 1,
		cookingSession: null,
		completionAttempts: 0,
		failNextShoppingCheck: true,
		historyItems: [],
	};

	await page.route("**/recipes**", async (route) => {
		const path = new URL(route.request().url()).pathname;
		if (path.endsWith("/recipes/7/reviews")) return route.fulfill(fullFlowJson({ reviews: [] }));
		if (path.endsWith("/recipes/7")) return route.fulfill(fullFlowJson({ recipe: fullFlowRecipe }));
		if (path.endsWith("/recipes")) return route.fulfill(fullFlowJson({ recipes: [fullFlowRecipe], pagination: { page: 1, limit: 100, total: 1, totalPages: 1, hasNext: false } }));
		return route.fallback();
	});
	await page.route("**/users/me/wishlist", (route) => route.fulfill(fullFlowJson({ wishlist: [] })));
	await page.route("**/users/me/ratings", (route) => route.fulfill(fullFlowJson({ ratings: [] })));
	await page.route("**/users/me/collections", (route) => route.fulfill(fullFlowJson({ collections: [] })));
	await page.route("**/households", (route) => route.fulfill(fullFlowJson({ households: [] })));

	await page.route("**/users/me/meal-plans**", async (route) => {
		const request = route.request();
		const url = new URL(request.url());
		const path = url.pathname.slice(url.pathname.indexOf("/users/me/meal-plans"));
		if (request.method() === "GET" && path === "/users/me/meal-plans") return route.fulfill(fullFlowJson({ plans: state.plan ? [state.plan] : [] }));
		if (request.method() === "POST" && path === "/users/me/meal-plans") {
			const body = JSON.parse(request.postData() || "{}");
			state.plan = { plan_id: 12, name: body.name, start_date: body.from, end_date: body.to, created_at: "2026-09-14T00:00:00.000Z", updated_at: "2026-09-14T00:00:00.000Z" };
			return route.fulfill(fullFlowJson({ plan: state.plan }, 201));
		}
		if (request.method() === "GET" && path === "/users/me/meal-plans/12") return route.fulfill(fullFlowJson({ plan: state.plan, items: state.planItem ? [state.planItem] : [] }));
		if (request.method() === "POST" && path === "/users/me/meal-plans/12/items") {
			const body = JSON.parse(request.postData() || "{}");
			state.planItem = { item_id: 4, plan_id: 12, recipe_id: body.recipeId, recipe_name: fullFlowRecipe.recipe_name, planned_date: body.date, slot: body.slot, servings: body.servings, source_type: "recipe", leftover_batch_id: null, created_at: "2026-09-14T00:00:00.000Z" };
			return route.fulfill(fullFlowJson({ item: state.planItem }, 201));
		}
		return route.fallback();
	});

	await page.route("**/users/me/shopping-list", async (route) => {
		if (route.request().method() === "GET") return route.fulfill(fullFlowJson({ items: state.shoppingItems }));
		return route.fallback();
	});
	await page.route("**/users/me/shopping-list/from-recipe", async (route) => {
		if (route.request().method() !== "POST") return route.fallback();
		const existing = state.shoppingItems.find((item) => !item.checked && item.label.toLowerCase() === "rice" && item.quantity === "2 kg");
		const item = existing || { item_id: state.nextShoppingItemId++, label: "rice", quantity: "2 kg", source_recipe_id: fullFlowRecipe.recipe_id, source_recipe_name: fullFlowRecipe.recipe_name, checked: false };
		if (!existing) state.shoppingItems = [...state.shoppingItems, item];
		return route.fulfill(fullFlowJson({ recipes: [fullFlowRecipe.recipe_name], items: [item] }));
	});
	await page.route("**/users/me/shopping-list/items/*", async (route) => {
		if (route.request().method() !== "PATCH") return route.fallback();
		const itemId = Number(new URL(route.request().url()).pathname.split("/").pop());
		const item = state.shoppingItems.find((candidate) => candidate.item_id === itemId);
		const body = JSON.parse(route.request().postData() || "{}");
		if (!item) return route.fulfill(fullFlowJson({ code: "SHOPPING_ITEM_NOT_FOUND" }, 404));
		if (body.checked === true && state.failNextShoppingCheck) {
			state.failNextShoppingCheck = false;
			return route.fulfill(fullFlowJson({ code: "SHOPPING_ITEM_UPDATE_FAILED" }, 503));
		}
		Object.assign(item, body);
		return route.fulfill(fullFlowJson({ item }));
	});

	await page.route("**/users/me/pantry/from-shopping-list", async (route) => {
		if (route.request().method() !== "POST") return route.fallback();
		const purchasedItems = state.shoppingItems.filter((item) => item.checked);
		state.pantryItems = purchasedItems.map((item, index) => ({ pantry_id: 80 + index, name: item.label, have: true, quantity: 2, unit: "KILOGRAM" }));
		state.shoppingItems = state.shoppingItems.filter((item) => !item.checked);
		return route.fulfill(fullFlowJson({ imported_items: purchasedItems.length, skipped_items: [] }));
	});
	await page.route("**/users/me/pantry", async (route) => {
		if (route.request().method() === "GET") return route.fulfill(fullFlowJson({ items: state.pantryItems }));
		return route.fallback();
	});

	await page.route("**/users/me/cooking-session**", async (route) => {
		const request = route.request();
		const url = new URL(request.url());
		const path = url.pathname.slice(url.pathname.indexOf("/users/me/cooking-session"));
		if (request.method() === "GET" && path === "/users/me/cooking-session") return route.fulfill(fullFlowJson({ session: null }));
		if (request.method() === "POST" && path === "/users/me/cooking-session") {
			const body = JSON.parse(request.postData() || "{}");
			state.cookingSession = { session_id: 31, user_id: 7, recipe_id: body.recipeId, recipe_name: fullFlowRecipe.recipe_name, meal_plan_item_id: body.mealPlanItemId ?? null, planned_date: state.planItem?.planned_date ?? null, slot: state.planItem?.slot ?? null, servings: body.servings ?? 1, current_step: 0, status: "active", started_at: "2026-09-14T17:00:00.000Z", last_active_at: "2026-09-14T17:00:00.000Z", paused_at: null, completed_at: null, created_at: "2026-09-14T17:00:00.000Z", updated_at: "2026-09-14T17:00:00.000Z" };
			return route.fulfill(fullFlowJson({ session: state.cookingSession }, 201));
		}
		if (request.method() === "PATCH" && path === "/users/me/cooking-session/31") {
			const body = JSON.parse(request.postData() || "{}");
			if (body.currentStep !== undefined) state.cookingSession.current_step = body.currentStep;
			if (body.status !== undefined) state.cookingSession.status = body.status;
			return route.fulfill(fullFlowJson({ session: state.cookingSession }));
		}
		if (request.method() === "POST" && path === "/users/me/cooking-session/31/complete") {
			state.completionAttempts += 1;
			if (state.completionAttempts === 1) return route.fulfill(fullFlowJson({ code: "COOKING_INGREDIENT_SHORTAGE", shortages: [{ position: 0, ingredient_name: "salt", required_quantity: 1, required_unit: "GRAM", available_quantity: 0, missing_quantity: 1, pantry_id: null }] }, 409));
			state.cookingSession = { ...state.cookingSession, status: "completed", completed_at: "2026-09-14T17:35:00.000Z" };
			const history = { history_id: 21, user_id: 7, recipe_id: fullFlowRecipe.recipe_id, recipe_name: fullFlowRecipe.recipe_name, meal_plan_item_id: state.cookingSession.meal_plan_item_id, planned_date: state.cookingSession.planned_date, slot: state.cookingSession.slot, servings: state.cookingSession.servings, started_at: state.cookingSession.started_at, completed_at: state.cookingSession.completed_at, created_at: state.cookingSession.completed_at };
			state.historyItems = [history];
			return route.fulfill(fullFlowJson({ session: state.cookingSession, history }));
		}
		return route.fallback();
	});
	await page.route("**/users/me/cooking-history**", async (route) => {
		const request = route.request();
		const path = new URL(request.url()).pathname;
		if (path.endsWith("/cooking-history") && request.method() === "GET") return route.fulfill(fullFlowJson({ items: state.historyItems }));
		if (path.endsWith("/cooking-history/21/journal") && request.method() === "GET") return route.fulfill(fullFlowJson({ journal: null }));
		if (path.endsWith("/cooking-history/21/journal") && request.method() === "PUT") return route.fulfill(fullFlowJson({ journal: { journal_id: 41, history_id: 21, rating: 5, would_cook_again: true, notes: "The rice texture was right.", photos: [] } }));
		return route.fallback();
	});

	return state;
}

test("completes the production kitchen loop with duplicate and recovery safeguards", async ({ page }) => {
	await stubFullKitchenLoop(page);

	await page.goto(`/recipe?id=${fullFlowRecipe.recipe_id}`);
	await expect(page.getByRole("heading", { name: fullFlowRecipe.recipe_name })).toBeVisible();
	await page.getByRole("button", { name: "Add recipe to meal plan" }).click();
	await page.getByRole("dialog", { name: `Add ${fullFlowRecipe.recipe_name} to your plan` }).getByRole("button", { name: "Add to plan", exact: true }).click();
	await expect(page.getByText(`Added ${fullFlowRecipe.recipe_name} to your plan`, { exact: true })).toBeVisible();

	await page.goto("/shopping-list");
	const importButton = page.getByRole("button", { name: "Import 1 planned recipe", exact: true });
	await importButton.click();
	await expect(page.locator(".shopping-list__item")).toHaveCount(1);
	await importButton.click();
	await expect(page.locator(".shopping-list__item")).toHaveCount(1);

	const purchaseCheckbox = page.getByRole("checkbox", { name: "Mark rice as purchased" });
	await purchaseCheckbox.click();
	await expect(page.getByText("We could not save that change. Try again.", { exact: true })).toBeVisible();
	await page.getByRole("checkbox", { name: "Mark rice as purchased" }).click();
	await expect(page.getByRole("checkbox", { name: "Mark rice as not needed" })).toBeChecked();
	await page.getByRole("button", { name: "Add purchased items to pantry" }).click();
	await expect(page.getByText("1 purchased item added to your pantry.", { exact: true })).toBeVisible();

	await page.goto("/pantry");
	await expect(page.getByRole("heading", { name: "Pantry" })).toBeVisible();
	await expect(page.getByText("rice", { exact: true })).toBeVisible();

	await page.goto("/planning");
	await page.getByRole("link", { name: "Start cooking Chicken Curry" }).click();
	await expect(page.getByText("Step 1 of 2", { exact: true })).toBeVisible();
	await page.getByRole("button", { name: "Next step" }).click();
	await page.getByRole("button", { name: "Finish cooking" }).click();
	await expect(page.getByRole("heading", { name: "Some ingredients are missing" })).toBeVisible();
	await page.getByRole("button", { name: "Continue anyway" }).click();
	await expect(page.getByRole("heading", { name: "Recipe complete" })).toBeVisible();

	const leftoverDialog = page.getByRole("dialog", { name: `Save ${fullFlowRecipe.recipe_name} leftovers` });
	if (await leftoverDialog.count()) await leftoverDialog.getByRole("button", { name: "Skip" }).click();
	await page.getByRole("button", { name: "Back to plan" }).click();
	await expect(page).toHaveURL(/\/planning$/);

	await page.goto("/history");
	await expect(page.getByText("Planned cook", { exact: true })).toBeVisible();
	await page.getByRole("link", { name: "Write journal" }).click();
	await expect(page.getByRole("heading", { name: "How did it go?" })).toBeVisible();
	await page.getByLabel("Would cook this again").check();
	await page.getByLabel("Private notes").fill("The rice texture was right.");
	await page.getByRole("button", { name: "Save journal" }).click();
	await expect(page).toHaveURL(/\/history$/);
});
