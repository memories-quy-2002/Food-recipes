// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import axios from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";
import {
	clearAccessToken,
	setAccessToken,
} from "@/features/auth/state/authTokenStore";
import HeaderAuthButton from "./HeaderAuthButton";

vi.mock("@/shared/api/axios", () => ({
	default: { post: vi.fn() },
}));

vi.mock("@/shared/utils/convertImage", () => ({
	default: () => <span data-testid="avatar" />,
}));

vi.mock("react-redux", () => ({
	useDispatch: () => vi.fn(),
}));

vi.mock("@/features/auth/state/authSlice", () => ({
	authActions: { logout: () => ({ type: "auth/logout" }) },
}));

const renderHeader = (auth) =>
	render(
		<MemoryRouter>
			<HeaderAuthButton auth={auth} />
		</MemoryRouter>
	);

afterEach(() => {
	cleanup();
	clearAccessToken();
	vi.clearAllMocks();
	vi.restoreAllMocks();
});

describe("HeaderAuthButton memory-token boundary", () => {
	it("bootstraps a local user through refresh and validates it without storage tokens", async () => {
		const localUser = { user_id: 7, full_name: "Stored User" };
		const refreshedUser = { user_id: 7, full_name: "Validated User" };
		axios.post
			.mockResolvedValueOnce({ data: { token: "refreshed-token" } })
			.mockResolvedValueOnce({ data: { user: refreshedUser } });

		renderHeader({
			local: { isAuthenticated: true, user: localUser },
			session: { isAuthenticated: false, user: null },
		});

		await waitFor(() => expect(screen.getByText("Validated User")).toBeInTheDocument());
		expect(axios.post).toHaveBeenNthCalledWith(1, apiRoutes.authRefresh, {});
		expect(axios.post).toHaveBeenNthCalledWith(2, apiRoutes.authToken, { token: "refreshed-token" });
	});

	it("uses the existing memory token without falling back to browser storage", async () => {
		setAccessToken("memory-token");
		axios.post.mockResolvedValue({ data: { user: { full_name: "Memory User" } } });

		renderHeader({
			local: { isAuthenticated: true, user: { full_name: "Stored User" } },
			session: { isAuthenticated: false, user: null },
		});

		await waitFor(() => expect(screen.getByText("Memory User")).toBeInTheDocument());
		expect(axios.post).toHaveBeenCalledWith(apiRoutes.authToken, { token: "memory-token" });
		expect(axios.post).not.toHaveBeenCalledWith(apiRoutes.authRefresh, {});
	});
});
