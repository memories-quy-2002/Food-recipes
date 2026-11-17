import { expect, test } from "@playwright/test";
import { apiUrl, loginInBrowser, stubThirdPartyMedia, uniqueName } from "./real-stack/helpers.js";

const demoCredentials = {
	email: "demo.homecook@foodrecipes.local",
	password: "DemoPass123!",
};
const inventoryNames = ["beef bones", "rice noodles", "yellow onion", "ginger", "lime"];

async function getApiAuth(request) {
	const response = await request.post(apiUrl("/auth/login"), { data: { ...demoCredentials, remember: true } });
	expect(response.ok()).toBeTruthy();
	const body = await response.json();
	return {
		headers: { Authorization: `Bearer ${body.token}` },
	};
}

async function findRecipeId(request, name) {
	const response = await request.get(apiUrl(`/recipes?q=${encodeURIComponent(name)}&limit=100`));
	expect(response.ok()).toBeTruthy();
	const body = await response.json();
	const recipe = (body.recipes ?? []).find((candidate) => candidate.recipe_name === name);
	expect(recipe, `seeded recipe not found: ${name}`).toBeTruthy();
	return recipe.recipe_id;
}

async function authenticateRealPage(page) {
	await loginInBrowser(page);
	await page.goto("/pantry");
	await expect(page.getByRole("heading", { name: "Pantry", exact: true })).toBeVisible();
}

async function cleanupLocalInventory(request, headers, recipeIds = []) {
	const pantryResponse = await request.get(apiUrl("/users/me/pantry"), { headers });
	if (pantryResponse.ok()) {
		const pantry = await pantryResponse.json();
		for (const item of pantry.items ?? []) {
			if (inventoryNames.includes(String(item.name).trim().toLowerCase())) {
				await request.delete(apiUrl(`/users/me/pantry/${item.pantry_id}`), { headers });
			}
		}
	}

	const shoppingResponse = await request.get(apiUrl("/users/me/shopping-list"), { headers });
	if (shoppingResponse.ok()) {
		const shopping = await shoppingResponse.json();
		for (const item of shopping.items ?? []) {
			if (String(item.label).trim().toLowerCase() === "beef bones") {
				await request.delete(apiUrl(`/users/me/shopping-list/items/${item.item_id}`), { headers });
			}
		}
	}

	for (const recipeId of recipeIds) {
		const sessionResponse = await request.get(apiUrl(`/users/me/cooking-session?recipeId=${recipeId}`), { headers });
		if (!sessionResponse.ok()) continue;
		const session = (await sessionResponse.json()).session;
		if (session?.session_id) await request.delete(apiUrl(`/users/me/cooking-session/${session.session_id}`), { headers });
	}
}

async function addPantryItem(page, name, quantity, unit) {
	await page.getByRole("textbox", { name: "Pantry item" }).fill(name);
	await page.getByRole("spinbutton", { name: "Quantity" }).fill(String(quantity));
	await page.getByRole("combobox", { name: "Unit" }).selectOption(unit);
	await page.getByRole("button", { name: "Add pantry item" }).click();
	await expect(page.getByText(name, { exact: true })).toBeVisible();
}

async function openLastStep(page, recipeId, recipeName, stepCount) {
	await page.goto(`/recipe/cooking?id=${recipeId}&servings=2`);
	await expect(page.getByRole("heading", { name: recipeName, exact: true })).toBeVisible();
	const nextButton = page.getByRole("button", { name: "Next step" });
	const finishButton = page.getByRole("button", { name: "Finish cooking" });
	for (let step = 1; step < stepCount; step += 1) {
		await expect.poll(async () => (await nextButton.isEnabled()) || (await finishButton.isEnabled()), { timeout: 10000 }).toBeTruthy();
		if (!(await nextButton.isEnabled())) break;
		await nextButton.click();
	}
	await expect(finishButton).toBeEnabled();
}

test("real API: Pantry -> shortage handoff -> replenishment -> cooking completion -> history", async ({ page, request }, testInfo) => {
	const auth = await getApiAuth(request);
	const headers = auth.headers;
	const phoRecipeId = await findRecipeId(request, "Classic Vietnamese Pho");
	await cleanupLocalInventory(request, headers, [phoRecipeId]);
	const consoleErrors = [];
	page.on("console", (message) => { if (message.type() === "error") consoleErrors.push({ text: message.text(), url: message.location().url }); });
	page.on("pageerror", (error) => consoleErrors.push({ text: error.message, url: "" }));
	await stubThirdPartyMedia(page);

	try {
		await authenticateRealPage(page);
		await addPantryItem(page, "beef bones", 300, "GRAM");
		await addPantryItem(page, "rice noodles", 250, "GRAM");
		await addPantryItem(page, "yellow onion", 1, "PIECE");
		await addPantryItem(page, "ginger", 1, "PIECE");
		await addPantryItem(page, "lime", 1, "PIECE");

		await openLastStep(page, phoRecipeId, "Classic Vietnamese Pho", 4);
		await page.getByRole("button", { name: "Finish cooking" }).click();
		await expect(page.getByRole("dialog", { name: "Some ingredients are missing" })).toBeVisible();
		await expect(page.getByText("missing 200 g", { exact: false })).toBeVisible();
		const shortageDialog = page.getByRole("dialog", { name: "Some ingredients are missing" });
		await expect(shortageDialog.locator("li")).toHaveCount(1);
		await expect(shortageDialog).toContainText("beef bones");
		await page.getByRole("button", { name: "Stop and add to shopping list" }).click();
		await expect(page.locator('main[aria-labelledby="cooking-mode-title"] [role="status"]')).toContainText("missing ingredients were added to your shopping list");

		await page.getByRole("link", { name: "Open shopping list" }).click();
		await expect(page.getByRole("heading", { name: "Shopping List" })).toBeVisible();
		const missingItem = page.locator(".shopping-list__item").filter({ hasText: "beef bones" });
		await expect(missingItem).toContainText("200 g");

		await page.goto("/pantry");
		await page.getByRole("button", { name: "Edit beef bones" }).click();
		const editForm = page.getByRole("form", { name: "Edit beef bones" });
		await editForm.getByRole("spinbutton").fill("500");
		await editForm.getByRole("combobox").selectOption("GRAM");
		await editForm.getByRole("button", { name: "Save beef bones" }).click();
		await expect(page.getByText("500 g", { exact: true })).toBeVisible();

		await openLastStep(page, phoRecipeId, "Classic Vietnamese Pho", 4);
		await page.getByRole("button", { name: "Finish cooking" }).click();
		await expect(page.getByRole("heading", { name: "Classic Vietnamese Pho", exact: true })).toBeVisible();

		await page.goto("/pantry");
		const depletedItem = page.locator("li").filter({ hasText: "beef bones" });
		await expect(depletedItem).toContainText("0 g");
		await expect(depletedItem.getByRole("checkbox", { name: "Have any beef bones" })).not.toBeChecked();
		await page.goto("/history");
		await expect(page.getByRole("article").filter({ hasText: "Classic Vietnamese Pho" }).first()).toBeVisible();
		await page.screenshot({ path: testInfo.outputPath("real-inventory-history.png"), fullPage: true });
		expect(consoleErrors.filter((error) => !error.url.includes("/auth/refresh") && !error.url.includes("/cooking-session/"))).toEqual([]);
	} finally {
		await cleanupLocalInventory(request, headers, [phoRecipeId]);
	}
});

test("real API: cooking an unquantified draft is rejected without a false completion", async ({ request }) => {
	const auth = await getApiAuth(request);
	const headers = auth.headers;
	let draftRecipeId;
	let sessionId;
	try {
		const draftResponse = await request.post(apiUrl("/users/me/recipes/drafts"), {
			headers,
			data: {
				name: uniqueName("Unquantified acceptance recipe"),
				mealId: 1,
				categoryId: 1,
				prepTimeMinutes: 1,
				cookTimeMinutes: 1,
				ingredients: ["salt"],
				instructions: ["Add salt"],
			},
		});
		expect(draftResponse.status()).toBe(201);
		draftRecipeId = (await draftResponse.json()).recipe.recipe_id;

		const ingredientsResponse = await request.put(apiUrl(`/recipes/${draftRecipeId}/ingredients`), {
			headers,
			data: { ingredients: [{ name: "salt" }] },
		});
		expect(ingredientsResponse.ok()).toBeTruthy();

		const startResponse = await request.post(apiUrl("/users/me/cooking-session"), {
			headers,
			data: { recipeId: draftRecipeId, servings: 1 },
		});
		expect(startResponse.status()).toBe(201);
		sessionId = (await startResponse.json()).session.session_id;

		const completeResponse = await request.post(apiUrl(`/users/me/cooking-session/${sessionId}/complete`), {
			headers,
			data: {},
		});
		expect(completeResponse.status()).toBe(400);
		const errorBody = await completeResponse.json();
		expect(errorBody.code).toBe("COOKING_RECIPE_INGREDIENTS_UNQUANTIFIED");

		const activeResponse = await request.get(apiUrl(`/users/me/cooking-session?recipeId=${draftRecipeId}`), { headers });
		expect(activeResponse.ok()).toBeTruthy();
		expect((await activeResponse.json()).session.status).toBe("active");
	} finally {
		if (sessionId) {
			const abandonResponse = await request.delete(apiUrl(`/users/me/cooking-session/${sessionId}`), { headers });
			expect([200, 404]).toContain(abandonResponse.status());
		}
		if (draftRecipeId) {
			const deleteResponse = await request.delete(apiUrl(`/recipes/${draftRecipeId}`), { headers });
			expect([204, 404]).toContain(deleteResponse.status());
		}
	}
});

test("real PostgreSQL: two tabs confirming the same prepared meal create one shopping line", async ({ page, request }) => {
	const auth = await getApiAuth(request);
	const { headers } = auth;
	const recipeName = uniqueName("Concurrent preparation");
	const ingredientName = uniqueName("concurrent pantry-free ingredient");
	let recipeId;
	const secondTab = await page.context().newPage();
	try {
		const recipeResponse = await request.post(apiUrl("/recipes"), {
			headers,
			data: {
				name: recipeName,
				mealId: 1,
				categoryId: 1,
				prepTimeMinutes: 1,
				cookTimeMinutes: 1,
				ingredients: [ingredientName],
				structuredIngredients: [{ name: ingredientName, quantity: 20, unit: "GRAM" }],
				instructions: ["Add the ingredient"],
			},
		});
		expect(recipeResponse.status()).toBe(201);
		recipeId = (await recipeResponse.json()).recipe.recipe_id;

		await loginInBrowser(page);
		await Promise.all([page.goto(`/recipe?id=${recipeId}`), secondTab.goto(`/recipe?id=${recipeId}`)]);
		for (const tab of [page, secondTab]) {
			await expect(tab.locator("#recipe-title")).toHaveText(recipeName);
		}
		await Promise.all([page, secondTab].map((tab) => tab.getByRole("button", { name: "Check ingredients" }).click()));
		for (const tab of [page, secondTab]) {
			await expect(tab.getByRole("status", { name: "Meal preparation status" })).toContainText("1 to buy");
		}

		const isConfirmation = (response) => response.request().method() === "POST" && new URL(response.url()).pathname.endsWith("/users/me/shopping-list/prepare/add");
		const confirmations = [page, secondTab].map((tab) => tab.waitForResponse(isConfirmation));
		await Promise.all([page, secondTab].map((tab) => tab.getByRole("button", { name: "Add missing ingredients to shopping list" }).click()));
		const confirmationResponses = await Promise.all(confirmations);
		for (const response of confirmationResponses) expect(response.ok()).toBeTruthy();
		const insertedCounts = await Promise.all(confirmationResponses.map(async (response) => (await response.json()).added_shopping_items));
		expect(insertedCounts.sort()).toEqual([0, 1]);

		const shoppingResponse = await request.get(apiUrl("/users/me/shopping-list"), { headers });
		expect(shoppingResponse.ok()).toBeTruthy();
		const shoppingItems = (await shoppingResponse.json()).items ?? [];
		expect(shoppingItems.filter((item) => item.label === ingredientName)).toHaveLength(1);
	} finally {
		await secondTab.close();
		if (recipeId) {
			const shoppingResponse = await request.get(apiUrl("/users/me/shopping-list"), { headers });
			if (shoppingResponse.ok()) {
				for (const item of (await shoppingResponse.json()).items ?? []) {
					if (item.label === ingredientName) await request.delete(apiUrl(`/users/me/shopping-list/items/${item.item_id}`), { headers });
				}
			}
			const deleteResponse = await request.delete(apiUrl(`/recipes/${recipeId}`), { headers });
			expect([204, 404]).toContain(deleteResponse.status());
		}
	}
});

test("real PostgreSQL: a retried completion writes one history entry and deducts pantry once", async ({ request }) => {
	const { headers } = await getApiAuth(request);
	const recipeName = uniqueName("Completion retry");
	const ingredientName = uniqueName("completion retry ingredient");
	let recipeId;
	let pantryId;
	let sessionId;
	try {
		const recipeResponse = await request.post(apiUrl("/recipes"), {
			headers,
			data: {
				name: recipeName,
				mealId: 1,
				categoryId: 1,
				prepTimeMinutes: 1,
				cookTimeMinutes: 1,
				ingredients: [ingredientName],
				structuredIngredients: [{ name: ingredientName, quantity: 25, unit: "GRAM" }],
				instructions: ["Use the measured ingredient"],
			},
		});
		expect(recipeResponse.status()).toBe(201);
		recipeId = (await recipeResponse.json()).recipe.recipe_id;

		const pantryResponse = await request.post(apiUrl("/users/me/pantry"), {
			headers,
			data: { name: ingredientName, have: true, quantity: 100, unit: "GRAM" },
		});
		expect(pantryResponse.status()).toBe(201);
		pantryId = (await pantryResponse.json()).item.pantry_id;

		const startResponse = await request.post(apiUrl("/users/me/cooking-session"), {
			headers,
			data: { recipeId, servings: 1 },
		});
		expect(startResponse.status()).toBe(201);
		sessionId = (await startResponse.json()).session.session_id;

		const completeUrl = apiUrl(`/users/me/cooking-session/${sessionId}/complete`);
		const completionResponses = await Promise.all([
			request.post(completeUrl, { headers, data: {} }),
			request.post(completeUrl, { headers, data: {} }),
		]);
		expect(completionResponses.map((response) => response.status()).sort()).toEqual([201, 404]);
		const retryBody = await completionResponses.find((response) => response.status() === 404).json();
		expect(retryBody.code).toBe("COOKING_SESSION_NOT_FOUND");

		const historyResponse = await request.get(apiUrl("/users/me/cooking-history"), { headers });
		expect(historyResponse.ok()).toBeTruthy();
		const history = (await historyResponse.json()).items ?? [];
		expect(history.filter((item) => item.recipe_id === recipeId)).toHaveLength(1);

		const pantryAfterResponse = await request.get(apiUrl("/users/me/pantry"), { headers });
		expect(pantryAfterResponse.ok()).toBeTruthy();
		const pantryItems = (await pantryAfterResponse.json()).items ?? [];
		expect(Number(pantryItems.find((item) => item.pantry_id === pantryId)?.quantity)).toBe(75);
	} finally {
		if (pantryId) {
			const deletePantry = await request.delete(apiUrl(`/users/me/pantry/${pantryId}`), { headers });
			expect([200, 404]).toContain(deletePantry.status());
		}
		if (sessionId) {
			const deleteSession = await request.delete(apiUrl(`/users/me/cooking-session/${sessionId}`), { headers });
			expect([200, 404]).toContain(deleteSession.status());
		}
		if (recipeId) {
			const deleteRecipe = await request.delete(apiUrl(`/recipes/${recipeId}`), { headers });
			expect([204, 404]).toContain(deleteRecipe.status());
		}
	}
});
