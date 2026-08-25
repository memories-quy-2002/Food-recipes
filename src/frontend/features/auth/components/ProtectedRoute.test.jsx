// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import ProtectedRoute from "./ProtectedRoute";

const authState = vi.hoisted(() => ({
	value: {
		hydrated: false,
		local: { isAuthenticated: false, user: null },
		session: { isAuthenticated: false, user: null },
	},
}));

vi.mock("react-redux", () => ({
	useSelector: () => authState.value,
}));

afterEach(() => {
	authState.value = {
		hydrated: false,
		local: { isAuthenticated: false, user: null },
		session: { isAuthenticated: false, user: null },
	};
	vi.restoreAllMocks();
});

const renderRoute = () => render(
	<MemoryRouter initialEntries={["/planning?week=next"]}>
		<Routes>
			<Route path="/planning" element={<ProtectedRoute><div>Protected content</div></ProtectedRoute>} />
			<Route path="/account" element={<div>Account page</div>} />
		</Routes>
	</MemoryRouter>
);

describe("ProtectedRoute", () => {
	it("waits for auth hydration before redirecting", () => {
		renderRoute();

		expect(screen.getByRole("status")).toHaveTextContent(/checking your session/i);
		expect(screen.queryByText("Account page")).not.toBeInTheDocument();
	});

	it("redirects only after hydration confirms the user is unauthenticated", () => {
		authState.value = {
		hydrated: true,
		local: { isAuthenticated: false, user: null },
		session: { isAuthenticated: false, user: null },
	};

		renderRoute();

		expect(screen.getByText("Account page")).toBeInTheDocument();
	});
});
