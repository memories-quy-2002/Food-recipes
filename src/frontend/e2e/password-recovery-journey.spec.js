import { expect, test } from "@playwright/test";

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

test.describe("password recovery", () => {
	test("submits a generic forgot-password request without revealing account existence", async ({ page }) => {
		await stubAnonymousRefresh(page);
		let requestBody;
		await page.route("**/auth/forgot-password", (route) => {
			requestBody = JSON.parse(route.request().postData() || "{}");
			return route.fulfill(
				json({ message: "If the account exists, recovery instructions will be sent." }),
			);
		});

		await page.goto("/account?recovery=true");
		await page.getByLabel("Email address").fill("cook@example.test");
		await page.getByRole("button", { name: "Send recovery instructions" }).click();

		expect(requestBody).toEqual({ email: "cook@example.test" });
		await expect(page.getByRole("status")).toContainText(
			"If an account matches that email, we sent recovery instructions.",
		);
	});

	test("shows a safe state for an invalid reset token", async ({ page }) => {
		await stubAnonymousRefresh(page);
		const token = "opaque-browser-reset-token";
		await page.route("**/auth/reset-password", (route) =>
			route.fulfill(
				json({ code: "RECOVERY_TOKEN_INVALID", message: "Recovery token is invalid or expired" }, 401),
			),
		);

		await page.goto("/account/reset-password?token=" + token);
		await page.getByRole("textbox", { name: "New password", exact: true }).fill("new-password");
		await page.getByRole("textbox", { name: "Confirm new password", exact: true }).fill("new-password");
		await page.getByRole("button", { name: "Reset password" }).click();

		await expect(page.getByRole("alert")).toContainText(/invalid or has expired/i);
		await expect(page.locator("body")).not.toContainText(token);
		await expect(
			page.getByRole("link", { name: "Request a new recovery link" }),
		).toBeVisible();
	});

	test("completes a valid reset and clears the password form", async ({ page }) => {
		await stubAnonymousRefresh(page);
		const token = "opaque-browser-valid-reset-token";
		let requestBody;
		await page.route("**/auth/reset-password", (route) => {
			requestBody = JSON.parse(route.request().postData() || "{}");
			return route.fulfill(json({ message: "Password reset successfully." }));
		});

		await page.goto("/account/reset-password?token=" + token);
		await page.getByRole("textbox", { name: "New password", exact: true }).fill("new-password");
		await page.getByRole("textbox", { name: "Confirm new password", exact: true }).fill("new-password");
		await page.getByRole("button", { name: "Reset password" }).click();

		expect(requestBody).toEqual({ token, newPassword: "new-password" });
		await expect(page.getByRole("heading", { name: "Password reset complete" })).toBeVisible();
		await expect(page.locator("body")).not.toContainText(token);
	});
});
