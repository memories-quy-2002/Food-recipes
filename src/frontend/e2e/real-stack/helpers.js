import { expect } from "@playwright/test";

export const apiBaseUrl = (process.env.FOOD_RECIPES_E2E_API_URL || "http://localhost:3000/api/v1").replace(/\/+$/, "");

export const demoCredentials = {
	email: "demo.homecook@foodrecipes.local",
	password: "DemoPass123!",
};

export const apiUrl = (path) => `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;

export const uniqueName = (prefix) => `${prefix} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export async function stubThirdPartyMedia(page) {
	await page.route("https://fonts.googleapis.com/**", (route) =>
		route.fulfill({
			status: 200,
			contentType: "text/css",
			body: "/* External font loading is intentionally deterministic in acceptance tests. */",
		}),
	);
	await page.route("https://images.unsplash.com/**", (route) =>
		route.fulfill({
			status: 200,
			contentType: "image/svg+xml",
			body: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"2\" height=\"2\"><rect width=\"2\" height=\"2\" fill=\"#d8c7a3\"/></svg>",
		}),
	);
}

export const getRefreshCookie = (response) => {
	const setCookie = response.headers()["set-cookie"] || "";
	return setCookie.match(/food_refresh=([^;]+)/)?.[1] || null;
};

export async function loginApi(request, credentials = demoCredentials) {
	const response = await request.post(apiUrl("/auth/login"), {
		data: { ...credentials, remember: true },
	});
	await expect(response, `login failed for ${credentials.email}`).toBeOK();
	const body = await response.json();
	expect(body.token).toEqual(expect.any(String));
	return {
		user: body.user,
		token: body.token,
		refreshCookie: getRefreshCookie(response),
		headers: { Authorization: `Bearer ${body.token}` },
	};
}

export async function findRecipeByName(request, name) {
	const response = await request.get(apiUrl(`/recipes?q=${encodeURIComponent(name)}&limit=100`));
	await expect(response, `recipe search failed for ${name}`).toBeOK();
	const body = await response.json();
	const recipe = (body.recipes || []).find((candidate) => candidate.recipe_name === name);
	expect(recipe, `seeded recipe not found: ${name}`).toBeTruthy();
	return recipe;
}

export async function removeWishlistItem(request, headers, recipeId) {
	const response = await request.delete(apiUrl(`/users/me/wishlist/${recipeId}`), { headers });
	expect([200, 404], `unexpected wishlist cleanup status for recipe ${recipeId}`).toContain(response.status());
}

export async function loginInBrowser(page, credentials = demoCredentials, { remember = true } = {}) {
	await page.goto("/account?signup=false");
	await page.getByRole("textbox", { name: "Email address *" }).fill(credentials.email);
	await page.getByRole("textbox", { name: "Password *" }).fill(credentials.password);
	if (remember) {
		const rememberCheckbox = page.getByRole("checkbox", { name: "Remember me" });
		await rememberCheckbox.check();
		await expect(rememberCheckbox).toBeChecked();
	}
	await page.getByRole("button", { name: "Log in" }).click();
	await expect(page).toHaveURL(/\/$/);
	await expect(page.getByRole("button", { name: /Open account menu for/ })).toBeVisible();
	if (remember) {
		await expect.poll(() => page.evaluate(() => window.localStorage.getItem("isAuthenticated"))).toBe("true");
	}
}
