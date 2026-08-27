import { expect, test } from "@playwright/test";

const recipeName = "Avocado Toast with Chili";
const recipeId = 164;
const demoCredentials = {
	email: "demo.homecook@foodrecipes.local",
	password: "DemoPass123!",
};

const isApiResponse = (response, path, method) => {
	const url = new URL(response.url());
	return response.request().method() === method && url.pathname.endsWith(path);
};

const isCookingCompletionResponse = (response) => {
	const url = new URL(response.url());
	return response.request().method() === "POST" && /\/users\/me\/cooking-session\/\d+\/complete$/.test(url.pathname);
};

test("real browser: login, choose, prepare, cook, and complete a meal", async ({ page }, testInfo) => {
	const consoleErrors = [];
	page.on("console", (message) => {
		if (message.type() === "error") consoleErrors.push(message.text());
	});
	page.on("pageerror", (error) => consoleErrors.push(error.message));

	await page.goto("/account?signup=false");
	await page.getByRole("textbox", { name: "Email address *" }).fill(demoCredentials.email);
	await page.getByRole("textbox", { name: "Password *" }).fill(demoCredentials.password);
	await page.getByRole("button", { name: "Log in" }).click();

	await expect(page).toHaveURL(/\/$/);
	await expect(page.getByRole("heading", { name: "Know what to do next." })).toBeVisible();
	await page.getByRole("link", { name: `Open ${recipeName}` }).click();

	await expect(page).toHaveURL(new RegExp(`/recipe\\?id=${recipeId}$`));
	await expect(page.getByRole("heading", { name: recipeName, exact: true })).toBeVisible();

	const prepareResponsePromise = page.waitForResponse((response) =>
		isApiResponse(response, "/users/me/shopping-list/prepare", "POST"),
	);
	await page.getByRole("button", { name: "Prepare this meal" }).click();
	const prepareResponse = await prepareResponsePromise;
	const prepared = await prepareResponse.json();
	expect(prepareResponse.ok()).toBeTruthy();
	expect(prepared.recipe_id).toBe(recipeId);
	expect(prepared.recipe_name).toBe(recipeName);
	expect(prepared.ingredients.some(({ status }) => status === "missing")).toBeTruthy();
	await expect(page.getByRole("status", { name: "Meal preparation status" })).toBeVisible();

	await page.getByRole("link", { name: "Start cooking" }).click();
	await expect(page).toHaveURL(new RegExp(`/recipe/cooking\\?id=${recipeId}$`));
	await expect(page.getByRole("heading", { name: recipeName, exact: true })).toBeVisible();
	await expect(page.getByText("Step 1 of 3", { exact: true })).toBeVisible();

	for (const checkbox of await page.getByRole("checkbox").all()) {
		await checkbox.click({ force: true });
	}

	const nextStep = page.getByRole("button", { name: "Next step" });
	await nextStep.click();
	await expect(page.getByText("Step 2 of 3", { exact: true })).toBeVisible();
	await nextStep.click();
	await expect(page.getByText("Step 3 of 3", { exact: true })).toBeVisible();

	const shortageResponsePromise = page.waitForResponse((response) =>
		isCookingCompletionResponse(response) && response.status() === 409,
	);
	await page.getByRole("button", { name: "Finish cooking" }).click();
	const shortageResponse = await shortageResponsePromise;
	expect(shortageResponse.status()).toBe(409);

	const shortageDialog = page.getByRole("dialog", { name: "Some ingredients are missing" });
	await expect(shortageDialog).toBeVisible();
	await expect(shortageDialog).toContainText("missing");

	const completionResponsePromise = page.waitForResponse((response) =>
		isCookingCompletionResponse(response) && response.ok(),
	);
	await shortageDialog.getByRole("button", { name: "Continue anyway" }).click();
	const completionResponse = await completionResponsePromise;
	expect(completionResponse.ok()).toBeTruthy();

	await expect(page).toHaveURL(new RegExp(`/recipe\\?id=${recipeId}$`));
	await page.getByRole("link", { name: "History", exact: true }).click();
	await expect(page).toHaveURL(/\/history$/);
	await expect(page.getByRole("heading", { name: "Your cooking history" })).toBeVisible();
	const completedRecipeHeadings = page.getByRole("heading", { name: recipeName, exact: true });
	await expect(await completedRecipeHeadings.count()).toBeGreaterThan(0);
	await expect(completedRecipeHeadings.last()).toBeVisible();
	await page.screenshot({ path: testInfo.outputPath("live-kitchen-history.png"), fullPage: true });

	const unexpectedConsoleErrors = consoleErrors.filter(
		(error) => !error.includes("/auth/refresh") && !error.includes("/cooking-session/"),
	);
	expect(unexpectedConsoleErrors).toEqual([]);
});
