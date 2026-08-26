// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { useContext, type ReactElement } from "react";
import { cleanup, render, screen, type RenderResult } from "@testing-library/react";
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

vi.mock("@/features/auth/api/authSessionApi", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/features/auth/api/authSessionApi")>();
	return {
		...actual,
		authSessionApi: {
			...actual.authSessionApi,
			refresh: vi.fn(),
			logout: vi.fn(),
		},
	};
});

const refreshMock = vi.mocked(authSessionApi.refresh);
const logoutMock = vi.mocked(authSessionApi.logout);

const AuthSnapshot = (): ReactElement => {
	const { auth } = useContext(AuthContext);
	return (
		<>
			<output data-testid="auth-token">{auth.current.token}</output>
			<output data-testid="auth-hydrated">
				{String(auth.current.hydrated)}
			</output>
		</>
	);
};

const renderWithAuthStore = (
	{ authenticated = false }: { authenticated?: boolean } = {},
): RenderResult => {
	const store = configureStore({ reducer: { auth: authSlice.reducer } });
	if (authenticated) {
		store.dispatch(
			authSlice.actions.login({
				user: { user_id: 7, full_name: "Local User" },
			}),
		);
	}
	return render(
		<Provider store={store}>
			<AuthProvider>
				<AuthSnapshot />
			</AuthProvider>
		</Provider>,
	);
};

afterEach(() => {
	cleanup();
	refreshMock.mockReset();
	logoutMock.mockReset();
	clearAccessToken();
	vi.clearAllMocks();
	vi.restoreAllMocks();
});

describe("AuthProvider memory-token boundary", () => {
	it("exposes the memory access token to current consumers", async () => {
		setAccessToken("memory-token");
		refreshMock.mockResolvedValue({
			user: { user_id: 7, full_name: "Local User" },
			token: "memory-token",
		});

		renderWithAuthStore({ authenticated: true });

		expect(screen.getByTestId("auth-token")).toHaveTextContent("memory-token");
		await vi.waitFor(() =>
			expect(screen.getByTestId("auth-hydrated")).toHaveTextContent("true"),
		);
	});

	it("marks hydration complete after a refresh failure", async () => {
		refreshMock.mockRejectedValue(new Error("offline"));

		renderWithAuthStore();

		await vi.waitFor(() =>
			expect(screen.getByTestId("auth-hydrated")).toHaveTextContent("true"),
		);
	});
});
