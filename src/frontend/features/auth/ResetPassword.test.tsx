// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import ResetPassword from "./ResetPassword";

const mocks = vi.hoisted(() => ({
	resetPassword: vi.fn(),
	getSafeAuthErrorMessage: vi.fn(
		(_error: unknown, fallback: string) => fallback,
	),
}));

vi.mock("@/features/auth/api/passwordRecoveryApi", () => mocks);

const renderResetPassword = (
	entry = "/account/reset-password?token=opaque-reset-token",
) =>
	render(
		<MemoryRouter initialEntries={[entry]}>
			<ResetPassword />
		</MemoryRouter>,
	);

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

describe("ResetPassword", () => {
	it("shows a safe recovery action when the token is missing", () => {
		renderResetPassword("/account/reset-password");

		expect(screen.getByRole("alert")).toHaveTextContent(
			/recovery link is missing or invalid/i,
		);
		expect(
			screen.getByRole("link", { name: "Request a new recovery link" }),
		).toHaveAttribute("href", "/account?recovery=true");
	});

	it("validates matching new passwords before submitting", async () => {
		const user = userEvent.setup();
		renderResetPassword();

		await user.type(screen.getByLabelText("New password"), "new-password");
		await user.type(
			screen.getByLabelText("Confirm new password"),
			"different-password",
		);
		await user.click(screen.getByRole("button", { name: "Reset password" }));

		const confirmation = screen.getByLabelText("Confirm new password");
		expect(confirmation).toHaveAttribute("aria-invalid", "true");
		expect(confirmation).toHaveAttribute(
			"aria-describedby",
			"reset-confirm-password-error",
		);
		expect(screen.getByText("Passwords must match.")).toBeInTheDocument();
		expect(mocks.resetPassword).not.toHaveBeenCalled();
	});

	it("resets the password and clears the form after success", async () => {
		const user = userEvent.setup();
		mocks.resetPassword.mockResolvedValue({
			message: "Password reset successfully.",
		});
		renderResetPassword();

		await user.type(screen.getByLabelText("New password"), "new-password");
		await user.type(
			screen.getByLabelText("Confirm new password"),
			"new-password",
		);
		await user.click(screen.getByRole("button", { name: "Reset password" }));

		expect(mocks.resetPassword).toHaveBeenCalledWith(
			"opaque-reset-token",
			"new-password",
		);
		expect(await screen.findByRole("status")).toHaveTextContent(
			/password has been reset/i,
		);
		expect(screen.queryByLabelText("New password")).not.toBeInTheDocument();
		expect(document.body.textContent).not.toContain("opaque-reset-token");
	});

	it("shows safe invalid-token copy without exposing the token", async () => {
		const user = userEvent.setup();
		mocks.resetPassword.mockRejectedValue(new Error("invalid token"));
		mocks.getSafeAuthErrorMessage.mockReturnValue(
			"This recovery link is invalid or has expired. Request a new link to continue.",
		);
		renderResetPassword();

		await user.type(screen.getByLabelText("New password"), "new-password");
		await user.type(
			screen.getByLabelText("Confirm new password"),
			"new-password",
		);
		await user.click(screen.getByRole("button", { name: "Reset password" }));

		expect(await screen.findByRole("alert")).toHaveTextContent(
			/invalid or has expired/i,
		);
		expect(
			screen.getByRole("link", { name: "Request a new recovery link" }),
		).toBeInTheDocument();
		expect(document.body.textContent).not.toContain("opaque-reset-token");
	});
});
