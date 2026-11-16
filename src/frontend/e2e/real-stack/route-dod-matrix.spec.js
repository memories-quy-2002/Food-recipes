import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { apiUrl, loginApi, loginInBrowser, stubThirdPartyMedia, uniqueName } from "./helpers.js";

// 720 CSS px is the 200% desktop zoom reflow equivalent for a 1440px-wide viewport.
const viewportWidths = [320, 375, 390, 720, 768, 1024, 1440];

test("authenticated product routes fit the supported viewports and pass an axe scan", async ({ page, request }, testInfo) => {
	test.setTimeout(15 * 60 * 1000);
	await stubThirdPartyMedia(page);
	const { headers } = await loginApi(request);
	const householdResponse = await request.post(apiUrl("/households"), {
		headers,
		data: { name: uniqueName("Route DOD household with a long display name") },
	});
	expect(householdResponse.status()).toBe(201);
	const [recipesResponse, historyResponse, sessionResponse] = await Promise.all([
		request.get(apiUrl("/users/me/recipes?status=all"), { headers }),
		request.get(apiUrl("/users/me/cooking-history"), { headers }),
		request.get(apiUrl("/users/me/cooking-session"), { headers }),
	]);
	await expect(recipesResponse).toBeOK();
	await expect(historyResponse).toBeOK();
	await expect(sessionResponse).toBeOK();
	const recipes = (await recipesResponse.json()).recipes ?? [];
	const histories = (await historyResponse.json()).items ?? [];
	const session = (await sessionResponse.json()).session;
	const recipeId = recipes[0]?.recipe_id;
	const editableRecipeId = recipes.find((recipe) => recipe.status === "draft")?.recipe_id ?? recipeId;
	const historyId = histories[0]?.history_id;
	expect(recipeId, "The seeded user should own a recipe for route review").toBeTruthy();
	expect(historyId, "The seeded user should have a cooking history entry for journal review").toBeTruthy();

	await loginInBrowser(page);
	const observedMutations = [];
	page.on("request", (request) => {
		if (["GET", "HEAD", "OPTIONS"].includes(request.method())) return;
		const pathname = new URL(request.url()).pathname;
		if (pathname.endsWith("/auth/refresh")) return;
		observedMutations.push(`${request.method()} ${pathname}`);
	});
	const routes = [
		{ name: "Home", path: "/" },
		{ name: "Discover", path: "/food" },
		{ name: "Recipe detail", path: `/recipe?id=${recipeId}` },
		{ name: "Account", path: "/account?signup=false" },
		{ name: "Reset password", path: "/account/reset-password" },
		{ name: "Verify email", path: "/account/verify-email" },
		{ name: "Profile", path: "/profile" },
		{ name: "Preferences", path: "/profile/preferences" },
		{ name: "Households", path: "/households" },
		{ name: "Notifications", path: "/profile/notifications" },
		{ name: "Recipe import", path: "/recipes/import" },
		{ name: "Journal", path: `/history/journal?historyId=${historyId}` },
		{ name: "Cooking", path: `/recipe/cooking?id=${session?.recipe_id ?? recipeId}` },
		{ name: "Wishlist", path: "/wishlist" },
		{ name: "Planning", path: "/planning" },
		{ name: "Shopping list", path: "/shopping-list" },
		{ name: "Pantry", path: "/pantry" },
		{ name: "History", path: "/history" },
		{ name: "Create recipe", path: "/food/add" },
		{ name: "Edit recipe", path: `/food/edit?id=${editableRecipeId}` },
		{ name: "Saved redirect", path: "/saved" },
		{ name: "Not found", path: "/route-dod-test-not-found" },
	];

	for (const route of routes) {
		await page.goto(route.path);
		await expect(page.locator("#root"), `${route.name} should render`).toBeVisible();
		await page.waitForTimeout(200);

		for (const width of viewportWidths) {
			await page.setViewportSize({ width, height: 900 });
			const dimensions = await page.evaluate(() => ({
				viewportWidth: document.documentElement.clientWidth,
				documentWidth: document.documentElement.scrollWidth,
				bodyWidth: document.body.scrollWidth,
				overflowingElements: [...document.querySelectorAll("body *")]
					.map((element) => ({
						tag: element.tagName.toLowerCase(),
						className: typeof element.className === "string" ? element.className.slice(0, 120) : "",
						text: (element.textContent ?? "").trim().slice(0, 80),
						right: Math.round(element.getBoundingClientRect().right),
						width: Math.round(element.getBoundingClientRect().width),
					}))
					.filter((element) => element.width > 0 && element.right > document.documentElement.clientWidth + 1)
					.slice(0, 8),
			}));
			expect(
				dimensions.documentWidth,
				`${route.name} has horizontal overflow at ${width}px (document ${dimensions.documentWidth}px, body ${dimensions.bodyWidth}px; elements=${JSON.stringify(dimensions.overflowingElements)})`,
			).toBeLessThanOrEqual(dimensions.viewportWidth);

			const results = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
				.analyze();
			expect(
				results.violations.flatMap(({ id, impact, help, nodes }) => nodes.map((node) => `${impact}: ${id} - ${help}; target=${node.target.join(", ")}; html=${node.html}; failure=${node.failureSummary ?? ""}`)),
				`${route.name} axe violations at ${width}px`,
			).toEqual([]);

			if (width === 390 || width === 1440 || (width === 320 && ["Home", "Households"].includes(route.name))) {
				const routeSlug = route.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
				await page.screenshot({ path: testInfo.outputPath(`${routeSlug}-${width}.png`), fullPage: true });
			}
		}
	}
	// Opening cooking mode starts its session by design; no other route in this review may write user data.
	expect(observedMutations, "Only opening cooking mode may start a cooking session").toEqual(["POST /api/v1/users/me/cooking-session"]);
});
