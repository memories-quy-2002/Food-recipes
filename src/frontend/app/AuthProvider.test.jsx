// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React, { useContext } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { afterEach, describe, expect, it, vi } from "vitest";
import AuthProvider, { AuthContext } from "./AuthProvider";
import { authSessionApi } from "@/features/auth/api/authSessionApi";
import authSlice from "@/features/auth/state/authSlice";
import {
	clearAccessToken,
	setAccessToken,
} from "@/features/auth/state/authTokenStore";

vi.mock("@/features/auth/api/authSessionApi", () => ({
	authSessionApi: {
		refresh: vi.fn(),
		logout: vi.fn(),
	},
}));

const AuthSnapshot = () => {
	const { auth } = useContext(AuthContext);
	return <>
		<output data-testid="auth-token">{auth.current.token}</output>
		<output data-testid="auth-hydrated">{String(auth.current.hydrated)}</output>
	</>;
};

const renderWithAuthStore = ({ authenticated = false } = {}) => {
	const store = configureStore({ reducer: { auth: authSlice.reducer } });
	if (authenticated) {
		store.dispatch(authSlice.actions.login({ user: { user_id: 7, full_name: "Local User" } }));
	}
	return render(
		<Provider store={store}>
			<AuthProvider>
				<AuthSnapshot />
			</AuthProvider>
		</Provider>
	);
};

afterEach(() => {
	cleanup();
	authSessionApi.refresh.mockReset();
	authSessionApi.logout.mockReset();
	clearAccessToken();
	vi.clearAllMocks();
	vi.restoreAllMocks();
});

describe("AuthProvider memory-token boundary", () => {
	it("exposes the memory access token to current consumers", async () => {
		setAccessToken("memory-token");
		authSessionApi.refresh.mockResolvedValue({
			user: { user_id: 7, full_name: "Local User" },
			token: "memory-token",
		});

		renderWithAuthStore({ authenticated: true });

		expect(screen.getByTestId("auth-token")).toHaveTextContent("memory-token");
		await vi.waitFor(() => expect(screen.getByTestId("auth-hydrated")).toHaveTextContent("true"));
	});

	it("marks hydration complete after a refresh failure", async () => {
		authSessionApi.refresh.mockRejectedValue(new Error("offline"));

		renderWithAuthStore();

		await vi.waitFor(() => expect(screen.getByTestId("auth-hydrated")).toHaveTextContent("true"));
	});
});
