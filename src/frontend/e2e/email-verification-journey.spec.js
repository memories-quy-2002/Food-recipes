import { expect, test } from "@playwright/test";
import { bootstrapTestAuth } from "./auth-fixtures";

const json = (body, status = 200) => ({
	status,
	contentType: "application/json",
	body: JSON.stringify(body),
});

const stubAnonymousRefresh = async (page) => {
	await page.route("**/auth/refresh", (route) =>
		route.fulfill(json({ code: "REFRESH_TOKEN_INVALID", message: "Unauthenticated" }, 401)),
	);
};

test.describe("email verification", () => {
	test("consumes a verification token and keeps it out of the rendered page", async ({ page }) => {
		await stubAnonymousRefresh(page);
		const token = "opaque-browser-verification-token";
		let requestBody;
		await page.route("**/auth/verify-email", (route) => {
			requestBody = JSON.parse(route.request().postData() || "{}");
			return route.fulfill(json({ message: "Email verified successfully." }));
		});

		await page.goto("/account/verify-email?token=" + token);

		await expect(page.getByRole("heading", { name: "Email verified" })).toBeVisible();
		expect(requestBody).toEqual({ token });
		await expect(page.locator("body")).not.toContainText(token);
	});

	test("shows a safe state when the verification token is invalid", async ({ page }) => {
		await stubAnonymousRefresh(page);
		const token = "opaque-browser-expired-verification-token";
		await page.route("**/auth/verify-email", (route) =>
			route.fulfill(
				json({ code: "RECOVERY_TOKEN_INVALID", message: "Recovery token is invalid or expired" }, 401),
			),
		);

		await page.goto("/account/verify-email?token=" + token);

		await expect(page.getByRole("alert")).toContainText(/invalid or has expired/i);
		await expect(page.locator("body")).not.toContainText(token);
	});

	test("shows the resend action for an authenticated unverified cook", async ({ page }) => {
		const user = {
			user_id: 7,
			full_name: "Unverified Cook",
			email: "cook@example.test",
			email_verified: false,
		};
		await bootstrapTestAuth(page, user, "test-memory-unverified-token");
		let requestBody;
		await page.route("**/auth/resend-verification", (route) => {
			requestBody = JSON.parse(route.request().postData() || "{}");
			return route.fulfill(
				json({ message: "If the account is eligible, verification instructions will be sent." }),
			);
		});

		await page.goto("/account?signup=false");
		await expect(page.getByRole("heading", { name: "Verify your email" })).toBeVisible();
		await page.getByRole("button", { name: "Resend verification email" }).click();

		expect(requestBody).toEqual({});
		await expect(page.getByRole("status")).toContainText(
			/verification instructions will be sent/i,
		);
	});
});
