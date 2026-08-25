// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React, { useContext } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AuthProvider, { AuthContext } from "./AuthProvider";
import {
	clearAccessToken,
	setAccessToken,
} from "@/features/auth/state/authTokenStore";

vi.mock("react-redux", () => ({
	useDispatch: () => vi.fn(),
	useSelector: (selector) => selector({
		auth: {
			local: { isAuthenticated: true, user: { user_id: 7, full_name: "Local User" } },
			session: { isAuthenticated: false, user: null },
		},
	}),
}));

const AuthSnapshot = () => {
	const { auth } = useContext(AuthContext);
	return <output data-testid="auth-token">{auth.current.token}</output>;
};

afterEach(() => {
	cleanup();
	clearAccessToken();
	vi.clearAllMocks();
	vi.restoreAllMocks();
});

describe("AuthProvider memory-token boundary", () => {
	it("exposes the memory access token to current consumers", () => {
		setAccessToken("memory-token");

		render(
			<AuthProvider>
				<AuthSnapshot />
			</AuthProvider>
		);

		expect(screen.getByTestId("auth-token")).toHaveTextContent("memory-token");
	});
});
