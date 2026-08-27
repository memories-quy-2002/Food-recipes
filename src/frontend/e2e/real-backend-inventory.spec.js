import { expect, test } from "@playwright/test";

test.use({ baseURL: "http://localhost:5173" });

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
	const setCookie = response.headers()["set-cookie"] ?? "";
	const refreshCookie = setCookie.match(/food_refresh=([^;]+)/)?.[1] ?? null;
	return {
		headers: { Authorization: `Bearer ${body.token}` },
		refreshCookie,
	};
}

async function authenticateRealPage(page, auth) {
	if (auth.refreshCookie) {
		await page.context().addCookies([{
			name: "food_refresh",
			value: auth.refreshCookie,
			domain: "localhost",
			path: "/api/v1/auth",
			httpOnly: true,
			secure: false,
			sameSite: "Lax",
		}]);
	}
	await page.goto("/pantry");
	await expect(page.getByRole("heading", { name: "Know what you already have" })).toBeVisible();
}

async function cleanupLocalInventory(request, headers) {
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

	for (const recipeId of [51, 55]) {
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

async function openLastStep(page, recipeId, stepCount) {
	await page.goto(`/recipe/cooking?id=${recipeId}&servings=2`);
	await expect(page.getByRole("heading", { name: recipeId === 51 ? "Classic Vietnamese Pho" : "Banana Oat Pancakes" })).toBeVisible();
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
	await cleanupLocalInventory(request, headers);
	const consoleErrors = [];
	page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
	page.on("pageerror", (error) => consoleErrors.push(error.message));

	try {
		await authenticateRealPage(page, auth);
		await addPantryItem(page, "beef bones", 300, "GRAM");
		await addPantryItem(page, "rice noodles", 250, "GRAM");
		await addPantryItem(page, "yellow onion", 1, "PIECE");
		await addPantryItem(page, "ginger", 1, "PIECE");
		await addPantryItem(page, "lime", 1, "PIECE");

		await openLastStep(page, 51, 4);
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

		await openLastStep(page, 51, 4);
		await page.getByRole("button", { name: "Finish cooking" }).click();
		await expect(page.getByRole("heading", { name: "Classic Vietnamese Pho", exact: true })).toBeVisible();

		await page.goto("/pantry");
		const depletedItem = page.locator("li").filter({ hasText: "beef bones" });
		await expect(depletedItem).toContainText("0 g");
		await expect(depletedItem.getByRole("checkbox", { name: "beef bones available" })).not.toBeChecked();
		await page.goto("/history");
		await expect(page.getByRole("article").filter({ hasText: "Classic Vietnamese Pho" }).first()).toBeVisible();
		await page.screenshot({ path: testInfo.outputPath("real-inventory-history.png"), fullPage: true });
		expect(consoleErrors.filter((error) => !error.includes("409 (Conflict)"))).toEqual([]);
	} finally {
		await cleanupLocalInventory(request, headers);
	}
});

test("real API: recipe with unquantified ingredients is rejected without a false completion", async ({ page, request }) => {
	const auth = await getApiAuth(request);
	const headers = auth.headers;
	await cleanupLocalInventory(request, headers);
	try {
		await authenticateRealPage(page, auth);
		await openLastStep(page, 55, 3);
		await page.getByRole("button", { name: "Finish cooking" }).click();
		await expect(page.getByRole("alert")).toHaveText("This recipe needs a positive quantity and supported unit for every ingredient before it can be completed.");
		await expect(page.getByRole("heading", { name: "Recipe complete" })).toHaveCount(0);
	} finally {
		await cleanupLocalInventory(request, headers);
	}
});
