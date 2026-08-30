import { expect, test } from "@playwright/test";
import {
	apiUrl,
	getRefreshCookie,
	loginApi,
	uniqueName,
} from "./helpers.js";

test.describe.configure({ mode: "serial" });

test("real stack: emits browser security headers and keeps protected errors generic", async ({ request }) => {
	const liveResponse = await request.get(apiUrl("/health/live"));
	await expect(liveResponse).toBeOK();
	expect(liveResponse.headers()["x-content-type-options"]).toBe("nosniff");
	expect(liveResponse.headers()["x-frame-options"]).toBe("DENY");
	expect(liveResponse.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
	expect(liveResponse.headers()["content-security-policy"]).toContain("default-src 'self'");

	const protectedResponse = await request.get(apiUrl("/auth/me"));
	expect(protectedResponse.status()).toBe(401);
	const errorBody = await protectedResponse.json();
	expect(JSON.stringify(errorBody)).not.toMatch(/stack|JWT_SECRET|password/i);
});

test("real stack: rotates refresh sessions and revokes a reused token family", async ({ request }) => {
	const initial = await loginApi(request);
	expect(initial.refreshCookie).toBeTruthy();

	const rotatedResponse = await request.post(apiUrl("/auth/refresh"), {
		data: { refreshToken: initial.refreshCookie },
	});
	await expect(rotatedResponse).toBeOK();
	const rotatedCookie = getRefreshCookie(rotatedResponse);
	expect(rotatedCookie).toBeTruthy();

	const reuseResponse = await request.post(apiUrl("/auth/refresh"), {
		data: { refreshToken: initial.refreshCookie },
	});
	expect(reuseResponse.status()).toBe(401);

	const familyRevokedResponse = await request.post(apiUrl("/auth/refresh"), {
		data: { refreshToken: rotatedCookie },
	});
	expect(familyRevokedResponse.status()).toBe(401);
});

test("real stack: enforces recipe, collection, role, and input ownership boundaries", async ({ request }) => {
	const owner = await loginApi(request);
	const otherUser = await loginApi(request, {
		email: "demo.foodie@foodrecipes.local",
		password: "DemoPass123!",
	});
	const admin = await loginApi(request, {
		email: "demo.admin@foodrecipes.local",
		password: "DemoPass123!",
	});
	const recipeListResponse = await request.get(apiUrl("/users/me/recipes?status=all"), { headers: owner.headers });
	await expect(recipeListResponse).toBeOK();
	const ownedRecipe = (await recipeListResponse.json()).recipes?.find((recipe) => recipe.status !== "archived");
	expect(ownedRecipe).toBeTruthy();

	const unauthorizedUpdate = await request.patch(apiUrl(`/recipes/${ownedRecipe.recipe_id}`), {
		headers: otherUser.headers,
		data: { name: `${ownedRecipe.recipe_name} unauthorized` },
	});
	expect(unauthorizedUpdate.status()).toBe(403);

	const unchangedRecipe = await request.get(apiUrl(`/recipes/${ownedRecipe.recipe_id}`));
	await expect(unchangedRecipe).toBeOK();
	expect((await unchangedRecipe.json()).recipe.recipe_name).toBe(ownedRecipe.recipe_name);

	const collectionResponse = await request.post(apiUrl("/users/me/collections"), {
		headers: owner.headers,
		data: { name: uniqueName("Acceptance ownership") },
	});
	expect(collectionResponse.status()).toBe(201);
	const collectionId = (await collectionResponse.json()).collection.collection_id;
	expect(collectionId).toEqual(expect.any(Number));
	try {
		const crossUserCollectionRead = await request.get(apiUrl(`/users/me/collections/${collectionId}/recipes`), { headers: otherUser.headers });
		expect(crossUserCollectionRead.status()).toBe(404);
	} finally {
		const cleanupResponse = await request.delete(apiUrl(`/users/me/collections/${collectionId}`), { headers: owner.headers });
		expect(cleanupResponse.status()).toBe(200);
	}

	const normalAdminRead = await request.get(apiUrl("/admin/review-reports"), { headers: otherUser.headers });
	expect(normalAdminRead.status()).toBe(403);
	const adminRead = await request.get(apiUrl("/admin/review-reports"), { headers: admin.headers });
	await expect(adminRead).toBeOK();

	const invalidWishlistBody = await request.post(apiUrl("/users/me/wishlist"), {
		headers: owner.headers,
		data: { recipeId: ownedRecipe.recipe_id, userId: otherUser.user.user_id },
	});
	expect(invalidWishlistBody.status()).toBe(400);
});

test("real stack: rejects an oversized authentication payload at the HTTP boundary", async ({ request }) => {
	const response = await request.post(apiUrl("/auth/login"), {
		data: {
			email: `${"x".repeat(300_000)}@example.com`,
			password: "DemoPass123!",
		},
	});
	expect(response.status()).toBe(413);
});
