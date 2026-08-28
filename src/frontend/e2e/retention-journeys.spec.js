import { expect, test } from "@playwright/test";

const user = { user_id: 7, full_name: "Retention User", email: "retention@example.com" };
const recipe = {
	recipe_id: 42, recipe_name: "Weeknight Pasta", recipe_description: "A quick dinner.", category_id: 2, category_name: "Main Course", meal_id: 3, meal_name: "Dinner", date_added: null,
	prep_time_minutes: 15, cook_time_minutes: 20, total_time_minutes: 35, servings: 2, user_id: 7, status: "published", image_url: null,
	ingredients: ["pasta"], instructions: ["Boil pasta."], structured_ingredients: [], dietary_tags: [], allergen_tags: [],
};

const json = (body, status = 200) => ({ status, contentType: "application/json", body: JSON.stringify(body) });

async function stubRetentionApi(page) {
	const state = {
		preferences: { diet: "", avoidedAllergens: [], dislikedIngredients: [], preferredCuisines: [], cookingSkill: "", maxWeekdayCookMinutes: 30, defaultServings: 2, maxCaloriesPerServing: 650, minProteinGrams: 0, strictDislikes: false },
		shoppingItem: { item_id: 1, label: "pasta", quantity: "1 pack", source_recipe_id: 42, source_recipe_name: "Weeknight Pasta", checked: false },
		inviteSent: false,
	};
	await page.route("**/api/v1/**", async (route) => {
		const request = route.request();
		const method = request.method();
		const rawPath = new URL(request.url()).pathname;
		const path = rawPath.replace(/^\/api\/v1/, "");

		if (path === "/auth/refresh" || path === "/auth/token") return route.fulfill(json({ token: "retention-access-token", user }));
		if (path === "/users/me/notifications") return route.fulfill(json({ notifications: [] }));
		if (path === "/users/me/notification-preferences") return route.fulfill(json({ preferences: { pantryExpiry: true, mealReminder: true, resumeCooking: true, weeklyPlan: true, householdActivity: true } }));
		if (path === "/users/me/food-preferences") {
			if (method === "PUT") state.preferences = request.postDataJSON();
			return route.fulfill(json(state.preferences));
		}
		if (path === "/meals") return route.fulfill(json({ meals: [{ id: 3, name: "Dinner", description: "Evening meals" }] }));
		if (path === "/categories") return route.fulfill(json({ categories: [{ id: 2, name: "Main Course" }] }));
		if (path === "/home-feed" || path === "/users/me/home-feed") return route.fulfill(json({ sections: [{ key: "recommended", title: "Recommended for you", description: "Personalized ideas.", recipes: [recipe] }] }));
		if (path === "/recipes" && method === "GET") return route.fulfill(json({ recipes: [recipe], pagination: { page: Number(new URL(request.url()).searchParams.get("page") || 1), limit: 100, total: 1, totalPages: 1, hasNext: false } }));
		if (path === "/recipes/42" && method === "GET") return route.fulfill(json({ recipe }));
		if (path === "/recipes/42/reviews") return route.fulfill(json({ reviews: [] }));
		if (path === "/users/me/wishlist") return route.fulfill(json({ wishlist: [] }));
		if (path === "/users/me/ratings") return route.fulfill(json({ ratings: [] }));
		if (path === "/users/me/recipes/42/note") return route.fulfill(json({ note: null }));
		if (path === "/users/me/pantry") return route.fulfill(json({ items: [{ pantry_id: 4, name: "Spinach", have: true, quantity: 1, unit: "PIECE", expires_at: "2026-08-29", expiry_status: "use_soon", storage_location: "fridge" }] }));
		if (path === "/users/me/meal-plans" && method === "GET") return route.fulfill(json({ plans: [] }));
		if (path === "/users/me/meal-plans/generate-preview" && method === "POST") return route.fulfill(json({ previewToken: "preview-token", name: "This week", from: "2026-08-28", to: "2026-08-30", targetMeals: 1, items: [{ recipeId: 42, recipeName: recipe.recipe_name, date: "2026-08-28", slot: "dinner", servings: 2, locked: false, score: 1, reasons: ["Fits your preferences"] }] }));
		if (path === "/users/me/meal-plans/from-preview" && method === "POST") return route.fulfill(json({ plan: { plan_id: 9, name: "This week", start_date: "2026-08-28", end_date: "2026-08-30" }, items: [] }));
		if (path === "/users/me/cooking-session" && method === "GET") return route.fulfill(json({ session: null }));
		if (path === "/users/me/cooking-history" && method === "GET") return route.fulfill(json({ items: [{ history_id: 21, recipe_id: 42, recipe_name: recipe.recipe_name, meal_plan_item_id: null, planned_date: null, slot: null, servings: 2, started_at: "2026-08-28T17:00:00.000Z", completed_at: "2026-08-28T17:30:00.000Z", created_at: "2026-08-28T17:30:00.000Z" }] }));
		if (path === "/users/me/cooking-history/21/journal") {
			if (method === "PUT") return route.fulfill(json({ journal: { journal_id: 3, history_id: 21, rating: 5, would_cook_again: true, notes: "Great", photos: [] } }));
			return route.fulfill(json({ journal: null }));
		}
		if (path === "/users/me/shopping-list" && method === "GET") return route.fulfill(json({ items: [state.shoppingItem] }));
		if (path === "/users/me/shopping-list/items/1" && method === "PATCH") { state.shoppingItem.checked = request.postDataJSON().checked; return route.fulfill(json({ item: state.shoppingItem })); }
		if (path === "/users/me/shopping-list/items" && method === "GET") return route.fulfill(json({ items: [state.shoppingItem] }));
		if (path === "/households" && method === "GET") return route.fulfill(json({ households: [{ household_id: 12, name: "Smith Household", role: "OWNER" }] }));
		if (path === "/households/12/invites" && method === "POST") { state.inviteSent = true; return route.fulfill(json({ invite: { invite_id: 8, household_id: 12, email: "friend@example.com", expires_at: "2026-09-01T00:00:00.000Z" }, token: "one-time-token" })); }
		if (path === "/households/12/shopping-list" && method === "GET") return route.fulfill(json({ items: [{ ...state.shoppingItem, household_id: 12 }] }));
		if (path === "/users/me/recipe-imports/preview" && method === "POST") return route.fulfill(json({ preview: { sourceUrl: request.postDataJSON().url, name: "Imported Pasta", ingredients: ["pasta"], instructions: ["Boil pasta."] } }));
		if (path === "/users/me/recipe-imports/drafts" && method === "POST") return route.fulfill(json({ recipe: { ...recipe, status: "draft", recipe_name: request.postDataJSON().name } }));
		return route.fulfill(json({}));
	});
	return state;
}

async function authenticatedPage(page) {
	await page.addInitScript((authUser) => {
		localStorage.setItem("isAuthenticated", "true");
		localStorage.setItem("user", JSON.stringify(authUser));
	}, user);
	return stubRetentionApi(page);
}

test("preferences flow into a personalized home", async ({ page }) => {
	await authenticatedPage(page);
	await page.goto("/profile/preferences");
	await page.getByLabel("Diet").selectOption("vegan");
	await page.getByRole("button", { name: "Save changes" }).click();
	await page.goto("/");
	await expect(page.getByText("Recipes that fit your kitchen")).toBeVisible();
});

test("pantry expiry leads to a use-soon recipe search", async ({ page }) => {
	await authenticatedPage(page);
	await page.goto("/pantry");
	await expect(page.getByText("Use soon · Expires 2026-08-29")).toBeVisible();
	await page.getByRole("link", { name: "Find recipes using Spinach" }).click();
	await expect(page).toHaveURL(/\/food\?useSoon=true$/);
});

test("generated plan can be reviewed and saved before cooking", async ({ page }) => {
	await authenticatedPage(page);
	await page.goto("/planning");
	await page.getByRole("button", { name: "Generate week" }).click();
	await page.getByRole("button", { name: "Generate preview" }).click();
	await expect(page.getByRole("heading", { name: "Weeknight Pasta" })).toBeVisible();
	await page.getByRole("button", { name: "Save meal plan" }).click();
	await expect(page.getByRole("button", { name: "Generate week" })).toBeVisible();
});

test("household invite unlocks the shared shopping scope", async ({ page }) => {
	await authenticatedPage(page);
	await page.goto("/households");
	await page.getByLabel("Invite email").fill("friend@example.com");
	await page.getByRole("button", { name: "Invite to Smith Household" }).click();
	await expect(page.getByRole("status")).toContainText("Invite created");
	await page.goto("/shopping-list");
	await page.locator('select[aria-label="Kitchen scope"]:visible').selectOption("household:12");
	await expect(page.locator("main .shopping-list-page__eyebrow")).toHaveText("Smith Household");
});

test("recipe URL preview is editable and saved as a draft", async ({ page }) => {
	await authenticatedPage(page);
	await page.goto("/recipes/import");
	await page.getByLabel("Recipe URL").fill("https://example.com/pasta");
	await page.getByRole("button", { name: "Preview recipe" }).click();
	await page.getByLabel("Name").fill("Edited imported pasta");
	await page.getByRole("button", { name: "Save draft" }).click();
	await expect(page).toHaveURL(/\/profile$/);
});

test("completing a cook opens the private journal", async ({ page }) => {
	await authenticatedPage(page);
	await page.goto("/history");
	await page.getByRole("link", { name: "Write journal" }).click();
	await expect(page.getByRole("heading", { name: "How did it go?" })).toBeVisible();
	await page.getByLabel("Your rating").selectOption("5");
	await page.getByLabel("Private notes").fill("Great weeknight meal");
	await page.getByRole("button", { name: "Save journal" }).click();
	await expect(page).toHaveURL(/\/history$/);
});

test("offline shopping check syncs when connectivity returns", async ({ page }) => {
	await authenticatedPage(page);
	await page.goto("/shopping-list");
	const checkbox = page.getByRole("checkbox", { name: /Mark pasta as (purchased|not needed)/ });
	await checkbox.waitFor();
	await expect(checkbox).not.toBeChecked();
	await page.context().setOffline(true);
	await checkbox.click();
	await expect(checkbox).toBeChecked();
	await expect(page.getByText("Completed", { exact: true })).toBeVisible();
	const syncRequest = page.waitForRequest((request) => request.method() === "PATCH" && request.url().includes("/users/me/shopping-list/items/1"));
	await page.context().setOffline(false);
	await page.evaluate(() => window.dispatchEvent(new Event("online")));
	await syncRequest;
});
