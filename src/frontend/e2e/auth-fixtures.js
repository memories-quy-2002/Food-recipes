const defaultTestUser = { user_id: 7, full_name: "Smoke User" };

const json = (body, status = 200) => ({
	status,
	contentType: "application/json",
	body: JSON.stringify(body),
});

export async function bootstrapTestAuth(
	page,
	user = defaultTestUser,
	token = "test-memory-access-token"
) {
	await page.addInitScript((authUser) => {
		localStorage.setItem("isAuthenticated", "true");
		localStorage.setItem("user", JSON.stringify(authUser));
	}, user);
	await page.route("**/auth/refresh", (route) =>
		route.fulfill(json({ token, user }))
	);
	await page.route("**/auth/token", (route) =>
		route.fulfill(json({ user }))
	);
}
