// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { authSessionApi } from "@/features/auth/api/authSessionApi";
import HeaderAuthButton from "./HeaderAuthButton";

vi.mock("@/features/auth/api/authSessionApi", () => ({
	authSessionApi: { logout: vi.fn() },
}));

vi.mock("@/shared/utils/convertImage", () => ({
	default: () => <span data-testid="avatar" />,
}));

const dispatch = vi.fn();
vi.mock("react-redux", () => ({
	useDispatch: () => dispatch,
}));

vi.mock("@/features/auth/state/authSlice", () => ({
	authActions: { logout: () => ({ type: "auth/logout" }) },
}));

const renderHeader = (auth) => render(
	<MemoryRouter>
		<HeaderAuthButton auth={auth} />
	</MemoryRouter>
);

afterEach(() => {
	cleanup();
	dispatch.mockReset();
	authSessionApi.logout.mockReset();
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
		authSessionApi.logout.mockResolvedValue(undefined);
		renderHeader({
			local: { isAuthenticated: true, user: { full_name: "Restored User" } },
			session: { isAuthenticated: false, user: null },
		});

		fireEvent.click(screen.getByRole("button", { name: /restored user/i }));
		fireEvent.click(screen.getByRole("menuitem", { name: /sign out/i }));

		expect(authSessionApi.logout).toHaveBeenCalledOnce();
		expect(dispatch).not.toHaveBeenCalled();
		await vi.waitFor(() => expect(dispatch).toHaveBeenCalledWith({ type: "auth/logout" }));
	});

	it("clears local auth even when server logout fails", async () => {
		authSessionApi.logout.mockRejectedValue(new Error("offline"));
		renderHeader({
			local: { isAuthenticated: true, user: { full_name: "Restored User" } },
			session: { isAuthenticated: false, user: null },
		});

		fireEvent.click(screen.getByRole("button", { name: /restored user/i }));
		fireEvent.click(screen.getByRole("menuitem", { name: /sign out/i }));

		await vi.waitFor(() => expect(dispatch).toHaveBeenCalledWith({ type: "auth/logout" }));
	});
});
