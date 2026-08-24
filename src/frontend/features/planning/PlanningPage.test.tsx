// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PlanningPage from "./PlanningPage";

const mockPlanningQuery = vi.hoisted(() => ({
	data: null,
	isPending: false,
	isFetching: false,
	isError: false,
	error: null,
}));

vi.mock("./api/planningQueries", () => ({
	useMealPlanForWeekQuery: () => mockPlanningQuery,
	useCreateMealPlanMutation: () => ({ mutate: vi.fn(), isPending: false, error: null }),
	useAddMealPlanItemMutation: () => ({ mutate: vi.fn(), isPending: false, error: null }),
	useUpdateMealPlanItemMutation: () => ({ mutate: vi.fn(), isPending: false, error: null }),
	useDeleteMealPlanItemMutation: () => ({ mutate: vi.fn(), isPending: false, error: null }),
}));

const renderPage = () => {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});

	return render(
		<QueryClientProvider client={queryClient}>
			<MemoryRouter initialEntries={["/planning"]}>
				<PlanningPage />
			</MemoryRouter>
		</QueryClientProvider>,
	);
};

describe("PlanningPage", () => {
	beforeEach(() => {
		mockPlanningQuery.data = null;
		mockPlanningQuery.isPending = false;
		mockPlanningQuery.isFetching = false;
		mockPlanningQuery.isError = false;
		mockPlanningQuery.error = null;
	});

	it("shows an actionable empty state when the visible week has no plan", () => {
		renderPage();

		expect(screen.getByRole("heading", { name: "Plan your week" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Start a weekly plan" })).toBeTruthy();
	});

	it("shows a layout-preserving loading state while the week is loading", () => {
		mockPlanningQuery.isPending = true;
		renderPage();

		expect(screen.getByRole("status", { name: "Loading your meal plan" })).toBeTruthy();
	});
});
