// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, useLocation } from "react-router-dom";
import AppRoutes from "./AppRoutes";

const mocks = vi.hoisted(() => ({ useSelector: vi.fn() }));

vi.mock("react-redux", () => ({ useSelector: mocks.useSelector }));
vi.mock("@/features/auth/Account", () => ({
	default: () => <div data-testid="account-page">Account page</div>,
}));
vi.mock("@/features/recipes/EditRecipe", () => ({
	default: () => <div data-testid="edit-recipe-page">Edit recipe page</div>,
}));

const LocationProbe = () => {
	const location = useLocation();
	return <output data-testid="location">{location.pathname}{location.search}</output>;
};

const renderEditRoute = (isAuthenticated) => {
	mocks.useSelector.mockImplementation((selector) => selector({
		 auth: {
			hydrated: true,
			local: { isAuthenticated },
			session: { isAuthenticated: false },
		},
	}));

	return render(
		<MemoryRouter initialEntries={["/food/edit?id=42"]}>
			<AppRoutes />
			<LocationProbe />
		</MemoryRouter>,
	);
};

describe("AppRoutes owner edit boundary", () => {
	beforeEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	afterEach(() => cleanup());

	it("redirects unauthenticated edit-route access before rendering the edit page", async () => {
		renderEditRoute(false);

		expect(await screen.findByTestId("account-page")).toBeInTheDocument();
		expect(screen.queryByTestId("edit-recipe-page")).not.toBeInTheDocument();
		expect(screen.getByTestId("location")).toHaveTextContent("/account?signup=false");
	});

	it("renders the edit route for an authenticated user", async () => {
		renderEditRoute(true);

	expect(await screen.findByTestId("edit-recipe-page")).toBeInTheDocument();
		expect(screen.getByTestId("location")).toHaveTextContent("/food/edit?id=42");
	});
});
