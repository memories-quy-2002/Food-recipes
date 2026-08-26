// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import HeaderAuthButton from "./HeaderAuthButton";
import type { AuthState } from "./HeaderAuthButton";

const mockLogout = vi.hoisted(() => vi.fn());
const dispatch = vi.hoisted(() => vi.fn());

vi.mock("@/features/auth/api/authSessionApi", () => ({
	authSessionApi: { logout: mockLogout },
}));

vi.mock("@/shared/utils/convertImage", () => ({
	default: () => <span data-testid="avatar" />,
}));

vi.mock("react-redux", () => ({
	useDispatch: () => dispatch,
}));

vi.mock("@/features/auth/state/authSlice", () => ({
	authActions: { logout: () => ({ type: "auth/logout" }) },
}));

const renderHeader = (auth: AuthState) =>
	render(
		<MemoryRouter>
			<HeaderAuthButton auth={auth} />
		</MemoryRouter>,
	);

afterEach(() => {
	cleanup();
	dispatch.mockReset();
	mockLogout.mockReset();
	vi.restoreAllMocks();
});

	describe("HeaderAuthButton", () => {
	it("renders the restored user metadata without reading a browser token", () => {
		renderHeader({
			local: { isAuthenticated: true, user: { full_name: "Restored User" } },
			session: { isAuthenticated: false, user: null },
		});

		expect(screen.getByText("Restored User")).toBeInTheDocument();
	});

	it("logs out on the server before clearing local auth state", async () => {
		mockLogout.mockResolvedValue(undefined);
		renderHeader({
			local: { isAuthenticated: true, user: { full_name: "Restored User" } },
			session: { isAuthenticated: false, user: null },
		});

		fireEvent.click(screen.getByRole("button", { name: /restored user/i }));
		fireEvent.click(screen.getByRole("menuitem", { name: /sign out/i }));

		expect(mockLogout).toHaveBeenCalledOnce();
		expect(dispatch).not.toHaveBeenCalled();
		await vi.waitFor(() => expect(dispatch).toHaveBeenCalledWith({ type: "auth/logout" }));
	});

	it("clears local auth even when server logout fails", async () => {
		mockLogout.mockRejectedValue(new Error("offline"));
		renderHeader({
			local: { isAuthenticated: true, user: { full_name: "Restored User" } },
			session: { isAuthenticated: false, user: null },
		});

		fireEvent.click(screen.getByRole("button", { name: /restored user/i }));
		fireEvent.click(screen.getByRole("menuitem", { name: /sign out/i }));

		await vi.waitFor(() => expect(dispatch).toHaveBeenCalledWith({ type: "auth/logout" }));
	});
});
