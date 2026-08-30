import { expect, test } from "@playwright/test";
import { loginInBrowser, stubThirdPartyMedia, uniqueName } from "./real-stack/helpers.js";

const backendApi = "http://localhost:3000/api/v1";
const demoCredentials = {
	email: "demo.homecook@foodrecipes.local",
	password: "DemoPass123!",
};
const inventoryNames = ["beef bones", "rice noodles", "yellow onion", "ginger", "lime"];

async function getApiAuth(request) {
	const response = await request.post(`${backendApi}/auth/login`, { data: { ...demoCredentials, remember: true } });
	expect(response.ok()).toBeTruthy();
	const body = await response.json();
	return {
		headers: { Authorization: `Bearer ${body.token}` },
	};
}

async function findRecipeId(request, name) {
	const response = await request.get(`${backendApi}/recipes?q=${encodeURIComponent(name)}&limit=100`);
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
	const pantryResponse = await request.get(`${backendApi}/users/me/pantry`, { headers });
	if (pantryResponse.ok()) {
		const pantry = await pantryResponse.json();
		for (const item of pantry.items ?? []) {
			if (inventoryNames.includes(String(item.name).trim().toLowerCase())) {
				await request.delete(`${backendApi}/users/me/pantry/${item.pantry_id}`, { headers });
			}
		}
	}

	const shoppingResponse = await request.get(`${backendApi}/users/me/shopping-list`, { headers });
	if (shoppingResponse.ok()) {
		const shopping = await shoppingResponse.json();
		for (const item of shopping.items ?? []) {
			if (String(item.label).trim().toLowerCase() === "beef bones") {
				await request.delete(`${backendApi}/users/me/shopping-list/items/${item.item_id}`, { headers });
			}
		}
	}

	for (const recipeId of recipeIds) {
		const sessionResponse = await request.get(`${backendApi}/users/me/cooking-session?recipeId=${recipeId}`, { headers });
		if (!sessionResponse.ok()) continue;
		const session = (await sessionResponse.json()).session;
		if (session?.session_id) await request.delete(`${backendApi}/users/me/cooking-session/${session.session_id}`, { headers });
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
		await expect(depletedItem.getByRole("checkbox", { name: "beef bones available" })).not.toBeChecked();
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
		const draftResponse = await request.post(`${backendApi}/users/me/recipes/drafts`, {
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

		const ingredientsResponse = await request.put(`${backendApi}/recipes/${draftRecipeId}/ingredients`, {
			headers,
			data: { ingredients: [{ name: "salt" }] },
		});
		expect(ingredientsResponse.ok()).toBeTruthy();

		const startResponse = await request.post(`${backendApi}/users/me/cooking-session`, {
			headers,
			data: { recipeId: draftRecipeId, servings: 1 },
		});
		expect(startResponse.status()).toBe(201);
		sessionId = (await startResponse.json()).session.session_id;

		const completeResponse = await request.post(`${backendApi}/users/me/cooking-session/${sessionId}/complete`, {
			headers,
			data: {},
		});
		expect(completeResponse.status()).toBe(400);
		const errorBody = await completeResponse.json();
		expect(errorBody.code).toBe("COOKING_RECIPE_INGREDIENTS_UNQUANTIFIED");

		const activeResponse = await request.get(`${backendApi}/users/me/cooking-session?recipeId=${draftRecipeId}`, { headers });
		expect(activeResponse.ok()).toBeTruthy();
		expect((await activeResponse.json()).session.status).toBe("active");
	} finally {
		if (sessionId) {
			const abandonResponse = await request.delete(`${backendApi}/users/me/cooking-session/${sessionId}`, { headers });
			expect([200, 404]).toContain(abandonResponse.status());
		}
		if (draftRecipeId) {
			const deleteResponse = await request.delete(`${backendApi}/recipes/${draftRecipeId}`, { headers });
			expect([204, 404]).toContain(deleteResponse.status());
		}
	}
});
