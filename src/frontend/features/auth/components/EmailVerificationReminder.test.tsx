// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import EmailVerificationReminder from "./EmailVerificationReminder";
import authSlice from "@/features/auth/state/authSlice";

const resendVerificationMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/auth/api/passwordRecoveryApi", () => ({
	getSafeAuthErrorMessage: (_error: unknown, fallback: string) => fallback,
	resendVerification: resendVerificationMock,
}));

const renderReminder = (emailVerified = false) => {
	const store = configureStore({ reducer: { auth: authSlice.reducer } });
	store.dispatch(
		authSlice.actions.loginSession({
			user: {
				user_id: 7,
				full_name: "Unverified Cook",
				email_verified: emailVerified,
			},
		}),
	);
	render(
		<Provider store={store}>
			<MemoryRouter initialEntries={["/"]}>
				<EmailVerificationReminder />
			</MemoryRouter>
		</Provider>,
	);
};

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

describe("EmailVerificationReminder", () => {
	it("renders only for an authenticated unverified user", () => {
		renderReminder(false);
		expect(
			screen.getByRole("heading", { name: "Verify your email" }),
		).toBeInTheDocument();

		cleanup();
		renderReminder(true);
		expect(
			screen.queryByRole("heading", { name: "Verify your email" }),
		).not.toBeInTheDocument();
	});

	it("resends instructions, announces the result, and can be dismissed", async () => {
		const user = userEvent.setup();
		resendVerificationMock.mockResolvedValue({
			message: "If the account is eligible, verification instructions will be sent.",
		});
		renderReminder();

		await user.click(
			screen.getByRole("button", { name: "Resend verification email" }),
		);
		expect(resendVerificationMock).toHaveBeenCalledOnce();
		expect(await screen.findByRole("status")).toHaveTextContent(
			/verification instructions will be sent/i,
		);

		await user.click(
			screen.getByRole("button", {
			name: "Dismiss email verification reminder",
		}),
		);
		expect(
			screen.queryByRole("heading", { name: "Verify your email" }),
		).not.toBeInTheDocument();
	});
});
