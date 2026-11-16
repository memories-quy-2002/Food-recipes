import { expect, test } from "@playwright/test";
import {
	apiUrl,
	getRefreshCookie,
	loginApi,
	loginInBrowser,
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

test("real stack: household OWNER, MEMBER, VIEWER, and non-member permissions match across routes", async ({ request, page }) => {
	const owner = await loginApi(request);
	const member = await loginApi(request, { email: "demo.foodie@foodrecipes.local", password: "DemoPass123!" });
	const viewer = await loginApi(request, { email: "demo.admin@foodrecipes.local", password: "DemoPass123!" });
	const outsider = await loginApi(request, { email: "demo.chef@foodrecipes.local", password: "DemoPass123!" });
	const range = { from: "2026-11-16", to: "2026-11-22" };
	const householdName = uniqueName("Role matrix household");
	const personalShoppingLabel = uniqueName("personal conflict item");
	let householdId;
	let memberId;
	let viewerId;
	let personalShoppingItemId;
	const planIds = [];
	const shoppingItemIds = [];
	const pantryItemIds = [];

	try {
		const householdResponse = await request.post(apiUrl("/households"), {
			headers: owner.headers,
			data: { name: householdName },
		});
		expect(householdResponse.status()).toBe(201);
		householdId = (await householdResponse.json()).household.household_id;

		await loginInBrowser(page);
		await page.setViewportSize({ width: 320, height: 900 });
		await expect(page.getByRole("combobox", { name: "Kitchen scope" })).toBeVisible();
		const homeWidth = await page.evaluate(() => ({
			viewport: document.documentElement.clientWidth,
			document: document.documentElement.scrollWidth,
			boxes: ["header", "header > div", "header a[aria-label='Food recipes home']", "header > div > div:last-child", "#kitchen-scope", "header button[aria-label='Open navigation menu']"].map((selector) => {
				const element = document.querySelector(selector);
				if (!element) return { selector, missing: true };
				const rect = element.getBoundingClientRect();
				return { selector, left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) };
			}),
			overflowingElements: [...document.querySelectorAll("body *")]
				.map((element) => ({
					tag: element.tagName.toLowerCase(),
					className: typeof element.className === "string" ? element.className.slice(0, 100) : "",
					text: (element.textContent ?? "").trim().slice(0, 40),
					right: Math.round(element.getBoundingClientRect().right),
					width: Math.round(element.getBoundingClientRect().width),
				}))
				.filter((element) => element.width > 0 && element.right > document.documentElement.clientWidth + 1)
				.slice(0, 6),
		}));
		expect(homeWidth.document, `Home should not overflow at ${homeWidth.viewport}px with a household scope; boxes=${JSON.stringify(homeWidth.boxes)}; elements=${JSON.stringify(homeWidth.overflowingElements)}`).toBeLessThanOrEqual(homeWidth.viewport);

		for (const [invitedUser, role] of [[member, "MEMBER"], [viewer, "VIEWER"]]) {
			const inviteResponse = await request.post(apiUrl(`/households/${householdId}/invites`), {
				headers: owner.headers,
				data: { email: invitedUser.user.email },
			});
			expect(inviteResponse.status()).toBe(201);
			const { token } = await inviteResponse.json();
			const acceptResponse = await request.post(apiUrl(`/household-invites/${token}/accept`), {
				headers: invitedUser.headers,
			});
			expect(acceptResponse.status()).toBe(201);
			const acceptedMember = (await acceptResponse.json()).member;
			if (role === "MEMBER") memberId = acceptedMember.member_id;
			else viewerId = acceptedMember.member_id;
		}

		const householdDetails = await request.get(apiUrl(`/households/${householdId}`), { headers: owner.headers });
		expect(householdDetails.status()).toBe(200);
		const members = (await householdDetails.json()).members;
		memberId = members.find((candidate) => candidate.email === member.user.email).member_id;
		viewerId = members.find((candidate) => candidate.email === viewer.user.email).member_id;
		const viewerRoleResponse = await request.patch(apiUrl(`/households/${householdId}/members/${viewerId}`), {
			headers: owner.headers,
			data: { role: "VIEWER" },
		});
		expect(viewerRoleResponse.status()).toBe(200);

		const ownerPlanResponse = await request.post(apiUrl(`/households/${householdId}/meal-plans`), {
			headers: owner.headers,
			data: { name: uniqueName("Owner plan"), ...range },
		});
		expect(ownerPlanResponse.status()).toBe(201);
		planIds.push((await ownerPlanResponse.json()).plan.plan_id);

		const memberPlanResponse = await request.post(apiUrl(`/households/${householdId}/meal-plans`), {
			headers: member.headers,
			data: { name: uniqueName("Member plan"), ...range },
		});
		expect(memberPlanResponse.status()).toBe(201);
		planIds.push((await memberPlanResponse.json()).plan.plan_id);

		const ownerPantryResponse = await request.post(apiUrl(`/households/${householdId}/pantry`), {
			headers: owner.headers,
			data: { name: uniqueName("owner pantry item"), quantity: 2, unit: "GRAM" },
		});
		expect(ownerPantryResponse.status()).toBe(201);
		pantryItemIds.push((await ownerPantryResponse.json()).item.pantry_id);

		const memberPantryResponse = await request.post(apiUrl(`/households/${householdId}/pantry`), {
			headers: member.headers,
			data: { name: uniqueName("member pantry item"), quantity: 3, unit: "GRAM" },
		});
		expect(memberPantryResponse.status()).toBe(201);
		pantryItemIds.push((await memberPantryResponse.json()).item.pantry_id);

		const memberShoppingResponse = await request.post(apiUrl(`/households/${householdId}/shopping-list/items`), {
			headers: member.headers,
			data: { label: uniqueName("member shopping item"), quantity: "1 pack" },
		});
		const memberShoppingBody = await memberShoppingResponse.text();
		expect(memberShoppingResponse.status(), memberShoppingBody).toBe(201);
		const memberShoppingItemId = JSON.parse(memberShoppingBody).item.item_id;
		shoppingItemIds.push(memberShoppingItemId);
		const householdShoppingLabel = JSON.parse(memberShoppingBody).item.label;
		const duplicateHouseholdShoppingResponse = await request.post(apiUrl(`/households/${householdId}/shopping-list/items`), {
			headers: owner.headers,
			data: { label: householdShoppingLabel.toLowerCase(), quantity: "1 pack" },
		});
		expect(duplicateHouseholdShoppingResponse.status()).toBe(201);
		expect((await duplicateHouseholdShoppingResponse.json()).item.item_id).toBe(memberShoppingItemId);

		const personalShoppingResponse = await request.post(apiUrl("/users/me/shopping-list/items"), {
			headers: owner.headers,
			data: { label: personalShoppingLabel, quantity: "1 pack" },
		});
		expect(personalShoppingResponse.status()).toBe(201);
		personalShoppingItemId = (await personalShoppingResponse.json()).item.item_id;
		const duplicatePersonalShoppingResponse = await request.post(apiUrl("/users/me/shopping-list/items"), {
			headers: owner.headers,
			data: { label: personalShoppingLabel.toLowerCase(), quantity: "1 pack" },
		});
		expect(duplicatePersonalShoppingResponse.status()).toBe(201);
		expect((await duplicatePersonalShoppingResponse.json()).item.item_id).toBe(personalShoppingItemId);

		const viewerReads = await Promise.all([
			request.get(apiUrl(`/households/${householdId}`), { headers: viewer.headers }),
			request.get(apiUrl(`/households/${householdId}/meal-plans`), { headers: viewer.headers }),
			request.get(apiUrl(`/households/${householdId}/pantry`), { headers: viewer.headers }),
			request.get(apiUrl(`/households/${householdId}/shopping-list`), { headers: viewer.headers }),
		]);
		for (const response of viewerReads) expect(response.status()).toBe(200);

		const previewResponse = await request.post(apiUrl(`/households/${householdId}/shopping-list/weekly-preview`), {
			headers: viewer.headers,
			data: { planId: planIds[0], ...range },
		});
		expect(previewResponse.status()).toBe(201);
		const preview = await previewResponse.json();
		const viewerWrites = await Promise.all([
			request.post(apiUrl(`/households/${householdId}/shopping-list/weekly-confirm`), {
				headers: viewer.headers,
				data: { planId: planIds[0], ...range, snapshot: preview.snapshot },
			}),
			request.post(apiUrl(`/households/${householdId}/meal-plans`), {
				headers: viewer.headers,
				data: { name: uniqueName("forbidden viewer plan"), ...range },
			}),
			request.post(apiUrl(`/households/${householdId}/pantry`), {
				headers: viewer.headers,
				data: { name: uniqueName("forbidden viewer pantry item"), quantity: 1, unit: "GRAM" },
			}),
			request.post(apiUrl(`/households/${householdId}/shopping-list/items`), {
				headers: viewer.headers,
				data: { label: uniqueName("forbidden viewer shopping item") },
			}),
			request.patch(apiUrl(`/households/${householdId}/pantry/${pantryItemIds[0]}`), {
				headers: viewer.headers,
				data: { quantity: 99, unit: "GRAM" },
			}),
			request.patch(apiUrl(`/households/${householdId}/shopping-list/items/${shoppingItemIds[0]}`), {
				headers: viewer.headers,
				data: { checked: true },
			}),
			request.patch(apiUrl(`/households/${householdId}/meal-plans/${planIds[0]}`), {
				headers: viewer.headers,
				data: { name: uniqueName("forbidden viewer edit"), ...range },
			}),
		]);
		for (const response of viewerWrites) expect(response.status()).toBe(403);

		const outsiderResponses = await Promise.all([
			request.get(apiUrl(`/households/${householdId}`), { headers: outsider.headers }),
			request.get(apiUrl(`/households/${householdId}/pantry`), { headers: outsider.headers }),
			request.get(apiUrl(`/households/${householdId}/shopping-list`), { headers: outsider.headers }),
			request.get(apiUrl(`/households/${householdId}/meal-plans`), { headers: outsider.headers }),
			request.post(apiUrl(`/households/${householdId}/shopping-list/items`), {
				headers: outsider.headers,
				data: { label: uniqueName("forbidden outsider shopping item") },
			}),
		]);
		for (const response of outsiderResponses) expect(response.status()).toBe(403);
	} finally {
		if (householdId) {
			for (const itemId of shoppingItemIds) {
				await request.delete(apiUrl(`/households/${householdId}/shopping-list/items/${itemId}`), { headers: owner.headers });
			}
			for (const itemId of pantryItemIds) {
				await request.delete(apiUrl(`/households/${householdId}/pantry/${itemId}`), { headers: owner.headers });
			}
			for (const planId of planIds) {
				await request.delete(apiUrl(`/households/${householdId}/meal-plans/${planId}`), { headers: owner.headers });
			}
			for (const id of [memberId, viewerId].filter(Boolean)) {
				await request.delete(apiUrl(`/households/${householdId}/members/${id}`), { headers: owner.headers });
			}
		}
		if (personalShoppingItemId) {
			await request.delete(apiUrl(`/users/me/shopping-list/items/${personalShoppingItemId}`), { headers: owner.headers });
		}
	}
});
