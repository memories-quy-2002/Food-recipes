// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import VerifyEmail from "./VerifyEmail";
import authSlice from "@/features/auth/state/authSlice";

const mocks = vi.hoisted(() => ({
	verifyEmail: vi.fn(),
	getSafeAuthErrorMessage: vi.fn(
		(_error: unknown, fallback: string) => fallback,
	),
}));

vi.mock("@/features/auth/api/passwordRecoveryApi", () => mocks);

const createStore = (authenticated = false) => {
	const store = configureStore({ reducer: { auth: authSlice.reducer } });
	if (authenticated) {
		store.dispatch(
			authSlice.actions.loginSession({
				user: {
					user_id: 7,
					full_name: "Unverified Cook",
					email_verified: false,
				},
			}),
		);
	}
	return store;
};

const renderVerification = (
	entry = "/account/verify-email?token=opaque-verification-token",
	authenticated = false,
) => {
	const store = createStore(authenticated);
	render(
		<Provider store={store}>
			<MemoryRouter initialEntries={[entry]}>
				<VerifyEmail />
			</MemoryRouter>
		</Provider>,
	);
	return store;
};

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

describe("VerifyEmail", () => {
	it("handles a missing token without making a request", () => {
		renderVerification("/account/verify-email");

		expect(screen.getByRole("alert")).toHaveTextContent(
			/verification link is missing or invalid/i,
		);
		expect(mocks.verifyEmail).not.toHaveBeenCalled();
	});

	it("verifies a token and never renders the token value", async () => {
		mocks.verifyEmail.mockResolvedValue({
			message: "Email verified successfully.",
		});
		renderVerification();

		expect(await screen.findByRole("heading", { name: "Email verified" })).toBeInTheDocument();
		expect(screen.getByRole("status")).toHaveTextContent(
			/email is verified/i,
		);
		expect(mocks.verifyEmail).toHaveBeenCalledWith(
			"opaque-verification-token",
		);
		expect(document.body.textContent).not.toContain("opaque-verification-token");
	});

	it("updates the authenticated user after verification", async () => {
		mocks.verifyEmail.mockResolvedValue({
			message: "Email verified successfully.",
		});
		const store = renderVerification(
			"/account/verify-email?token=opaque-verification-token",
			true,
		);

		await screen.findByRole("heading", { name: "Email verified" });
		expect(store.getState().auth.session.user?.email_verified).toBe(true);
	});

	it("shows safe failure copy for invalid or expired tokens", async () => {
		mocks.verifyEmail.mockRejectedValue(new Error("invalid token"));
		renderVerification();

		expect(await screen.findByRole("alert")).toHaveTextContent(
			/invalid or has expired/i,
		);
		expect(document.body.textContent).not.toContain("opaque-verification-token");
	});
});
