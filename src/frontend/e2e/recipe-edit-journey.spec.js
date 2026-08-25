import { expect, test } from "@playwright/test";

const recipeId = 42;
const testUser = { user_id: 7, full_name: "Smoke User" };

const publishedRecipe = {
	recipe_id: recipeId,
	recipe_name: "Summer Pasta",
	recipe_description: "A bright pasta dinner.",
	category_id: 2,
	category_name: "Main Course",
	meal_id: 3,
	meal_name: "Dinner",
	prep_time_minutes: 15,
	cook_time_minutes: 20,
	servings: 4,
	user_id: testUser.user_id,
	status: "published",
	image_url: null,
	ingredients: ["Pasta", "Cherry tomatoes"],
	instructions: ["Boil the pasta.", "Toss with the tomatoes."],
	structured_ingredients: [{
		quantity_text: "2",
		unit: "cups",
		name: "Cherry tomatoes",
		preparation: "halved",
	}],
	nutrition: { servings: 4, calories: 480, protein: 16 },
	dietary_tags: ["vegetarian"],
	allergen_tags: ["milk"],
};

const json = (body, status = 200) => ({
	status,
	contentType: "application/json",
	body: JSON.stringify(body),
});

const clone = (value) => JSON.parse(JSON.stringify(value));

async function authenticateAsTestUser(page) {
	await page.addInitScript((user) => {
		localStorage.setItem("isAuthenticated", "true");
		localStorage.setItem("user", JSON.stringify(user));
		localStorage.setItem("jwt", "test-scoped-recipe-edit-token");
	}, testUser);
}

async function stubRecipeEditingApi(page, {
	initialRecipe = publishedRecipe,
	ownedRecipesStatus = 200,
	ownedRecipes = [initialRecipe],
} = {}) {
	const state = {
		recipe: clone(initialRecipe),
		saveRequests: [],
	};

	await page.route("**/*", async (route) => {
		const request = route.request();
		const path = new URL(request.url()).pathname;
		const method = request.method();

		if (path.endsWith("/auth/token")) {
			return route.fulfill(json({ user: testUser }));
		}

		if (path.endsWith("/users/me/recipes")) {
			if (method !== "GET") return route.fallback();
			if (ownedRecipesStatus !== 200) {
				return route.fulfill(json({ message: "Recipe access denied." }, ownedRecipesStatus));
			}
			return route.fulfill(json({ recipes: ownedRecipes.map(clone) }));
		}

		if (path.endsWith("/users/me/ratings")) {
			return route.fulfill(json({ ratings: [] }));
		}

		if (path.endsWith("/users/me/wishlist")) {
			return route.fulfill(json({ wishlist: [] }));
		}

		if (path.endsWith("/categories")) {
			return route.fulfill(json({ categories: [{ id: 2, name: "Main Course" }] }));
		}

		if (path.endsWith("/meals")) {
			return route.fulfill(json({ meals: [{ id: 3, name: "Dinner" }] }));
		}

		if (path.endsWith("/recipes") && method === "GET") {
			return route.fulfill(json({
				recipes: [state.recipe],
				pagination: { page: 1, limit: 100, total: 1, totalPages: 1, hasNext: false },
			}));
		}

		if (path.endsWith(`/recipes/${recipeId}`)) {
			if (method === "GET") return route.fulfill(json({ recipe: state.recipe }));
			if (method === "PATCH") {
				const payload = request.postDataJSON();
				state.recipe = {
					...state.recipe,
					recipe_name: payload.name ?? state.recipe.recipe_name,
					recipe_description: payload.description ?? state.recipe.recipe_description,
				};
				state.saveRequests.push({ method, path, payload });
				return route.fulfill(json({ recipe: state.recipe }));
			}
		}

		for (const section of ["ingredients", "nutrition", "dietary-tags"]) {
			if (path.endsWith(`/recipes/${recipeId}/${section}`) && method === "PUT") {
				state.saveRequests.push({ method, path, payload: request.postDataJSON() });
				return route.fulfill(json({ recipe: state.recipe }));
			}
		}

		if (path.endsWith(`/recipes/${recipeId}/reviews`)) {
			return route.fulfill(json({ reviews: [] }));
		}

		return route.fallback();
	});

	return state;
}

test("owner opens Edit from Personal Recipes, saves a prefilled published recipe, and sees success", async ({ page }) => {
	await authenticateAsTestUser(page);
	const api = await stubRecipeEditingApi(page);

	await page.goto("/profile#recipes");
	await page.getByRole("button", { name: "Edit recipe Summer Pasta" }).click();

	await expect(page).toHaveURL(/\/food\/edit\?id=42$/);
	await expect(page.getByRole("heading", { name: "Edit recipe" })).toBeVisible();
	await expect(page.getByLabel("Recipe Name")).toHaveValue("Summer Pasta");
	await expect(page.getByLabel("Description")).toHaveValue("A bright pasta dinner.");
	await expect(page.getByLabel("Category")).toHaveValue("Main Course");
	await expect(page.getByRole("textbox", { name: "Ingredient 1 name" })).toHaveValue("Cherry tomatoes");

	await page.getByLabel("Recipe Name").fill("Summer Pasta Deluxe");
	await page.getByRole("button", { name: "Save changes" }).click();

	await expect(page).toHaveURL(/\/recipe\?id=42$/);
	await expect(page.getByRole("heading", { name: "Summer Pasta Deluxe" })).toBeVisible();
	await expect(page.getByRole("status").filter({ hasText: "Recipe changes saved" })).toBeVisible();
	await expect.poll(() => api.saveRequests.map(({ method, path }) => `${method} ${path}`)).toEqual([
		"PATCH /api/v1/recipes/42",
		"PUT /api/v1/recipes/42/ingredients",
		"PUT /api/v1/recipes/42/nutrition",
		"PUT /api/v1/recipes/42/dietary-tags",
	]);
});

test("owner can open and save a draft without publishing it", async ({ page }) => {
	await authenticateAsTestUser(page);
	const draft = { ...publishedRecipe, status: "draft", recipe_name: "Draft Pasta" };
	const api = await stubRecipeEditingApi(page, { initialRecipe: draft, ownedRecipes: [draft] });

	await page.goto(`/food/edit?id=${recipeId}`);
	await expect(page.getByLabel("Recipe Name")).toHaveValue("Draft Pasta");
	await page.getByLabel("Recipe Name").fill("Draft Pasta Updated");
	await page.getByRole("button", { name: "Save draft" }).click();

	await expect(page).toHaveURL(/\/profile$/);
	await expect.poll(() => api.saveRequests.some(({ method }) => method === "PATCH")).toBe(true);
	await expect(api.saveRequests.some(({ method, path }) => method === "PUT" && path.endsWith("/dietary-tags"))).toBe(true);
});

test("guest access redirects to login with the edit destination preserved", async ({ page }) => {
	await stubRecipeEditingApi(page);

	await page.goto(`/food/edit?id=${recipeId}`);

	await expect(page).toHaveURL(/\/account\?signup=false$/);
	await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
	await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
	await expect(page).not.toHaveURL(/\/food\/edit/);
});

test("owner sees a forbidden state when the owner-scoped recipe request is denied", async ({ page }) => {
	await authenticateAsTestUser(page);
	await stubRecipeEditingApi(page, { ownedRecipesStatus: 403 });

	await page.goto(`/food/edit?id=${recipeId}`);

	await expect(page.getByRole("alert")).toContainText("You cannot edit this recipe");
	await expect(page.getByText("Your account does not have permission to edit this recipe.")).toBeVisible();
	await expect(page.getByRole("heading", { name: "Edit recipe" })).not.toBeVisible();
});

test("missing owner recipe shows a not-found state without exposing another recipe", async ({ page }) => {
	await authenticateAsTestUser(page);
	await stubRecipeEditingApi(page, { ownedRecipes: [] });

	await page.goto(`/food/edit?id=${recipeId}`);

	await expect(page.getByRole("alert")).toContainText("Recipe not found");
	await expect(page.getByText("This recipe is no longer available in your cookbook.")).toBeVisible();
	await expect(page.getByRole("heading", { name: "Edit recipe" })).not.toBeVisible();
});

test("edit form remains usable without horizontal scrolling on a 390px viewport", async ({ page }) => {
	await authenticateAsTestUser(page);
	await stubRecipeEditingApi(page);
	await page.setViewportSize({ width: 390, height: 844 });

	await page.goto(`/food/edit?id=${recipeId}`);

	await expect(page.getByRole("heading", { name: "Edit recipe" })).toBeVisible();
	await expect(page.getByLabel("Recipe Name")).toHaveValue("Summer Pasta");
	const layout = await page.evaluate(() => ({
		viewportWidth: window.innerWidth,
		documentWidth: document.documentElement.scrollWidth,
	}));
	expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
});
