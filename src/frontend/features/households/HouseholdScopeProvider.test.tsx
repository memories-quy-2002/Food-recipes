// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext, type AuthState } from "@/app/AuthProvider";
import { HouseholdScopeProvider, useHouseholdScope } from "./HouseholdScopeProvider";
import HouseholdScopeSelector from "./HouseholdScopeSelector";

const listHouseholds = vi.hoisted(() => vi.fn());
vi.mock("./api/householdsQueries", () => ({
	useHouseholdsQuery: listHouseholds,
}));

const auth: AuthState = {
	isAuthenticated: true,
	hydrated: true,
	user: { user_id: 7, email: "cook@example.com", full_name: "Cook" },
	userId: 7,
	token: "test-token",
};

const ScopeConsumer = () => {
	const { scopeLabel, canEdit } = useHouseholdScope();
	return <output data-testid="scope-state">{scopeLabel}:{String(canEdit)}</output>;
};

const renderProvider = () => {
	const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	return render(
		<AuthContext.Provider value={{ auth: { current: auth } }}>
			<QueryClientProvider client={queryClient}>
				<HouseholdScopeProvider>
					<HouseholdScopeSelector />
					<ScopeConsumer />
				</HouseholdScopeProvider>
			</QueryClientProvider>
		</AuthContext.Provider>,
	);
};

describe("HouseholdScopeProvider", () => {
	beforeEach(() => {
		localStorage.clear();
		listHouseholds.mockReturnValue({
			data: {
				households: [
					{ household_id: 12, name: "Smith Household", role: "MEMBER" },
					{ household_id: 13, name: "Read-only Kitchen", role: "VIEWER" },
				],
			},
			isPending: false,
			isError: false,
		});
	});

	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it("shows an explicit personal/household scope switch and changes scope", async () => {
		renderProvider();

		const selector = screen.getByLabelText("Kitchen scope");
		expect(selector).toHaveValue("personal");
		fireEvent.change(selector, { target: { value: "household:12" } });

		await waitFor(() => expect(screen.getByTestId("scope-state")).toHaveTextContent("Smith Household:true"));
		expect(localStorage.getItem("food-recipes:kitchen-scope")).toBe("household:12");
	});

	it("renders household viewers as read-only", async () => {
		renderProvider();
		fireEvent.change(screen.getByLabelText("Kitchen scope"), { target: { value: "household:13" } });

		await waitFor(() => expect(screen.getByTestId("scope-state")).toHaveTextContent("Read-only Kitchen:false"));
	});
});
