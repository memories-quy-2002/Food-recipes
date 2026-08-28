// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { KitchenScope } from "@/features/households/householdScope";
import PantryPage from "./PantryPage";

const mockHousehold = vi.hoisted(() => ({
	scope: { kind: "personal" } as KitchenScope,
	canEdit: true,
	scopeLabel: "My pantry",
}));

const mockPantry = vi.hoisted(() => ({
	data: { items: [
		{ pantry_id: 4, name: "Eggs", have: true, quantity: 12, unit: "PIECE" },
		{ pantry_id: 5, name: "Tomatoes", have: true, quantity: 4, unit: "PIECE", expires_at: "2026-08-30", storage_location: "fridge", expiry_status: "use_soon" },
		{ pantry_id: 6, name: "Milk", have: true, quantity: 1, unit: "LITER", expires_at: "2026-08-27", storage_location: "fridge", expiry_status: "expired" },
	] },
	add: vi.fn(),
	update: vi.fn(),
	remove: vi.fn(),
	usePantryQuery: vi.fn(),
	useCreatePantryItemMutation: vi.fn(),
	useUpdatePantryItemMutation: vi.fn(),
	useDeletePantryItemMutation: vi.fn(),
	refetch: vi.fn(),
}));

vi.mock("@/features/households/HouseholdScopeProvider", () => ({
	useHouseholdScope: () => mockHousehold,
}));

vi.mock("./api/pantryQueries", () => ({
	usePantryQuery: mockPantry.usePantryQuery,
	useCreatePantryItemMutation: mockPantry.useCreatePantryItemMutation,
	useUpdatePantryItemMutation: mockPantry.useUpdatePantryItemMutation,
	useDeletePantryItemMutation: mockPantry.useDeletePantryItemMutation,
}));

const renderPage = () => render(
	<QueryClientProvider client={new QueryClient()}>
		<MemoryRouter>
			<PantryPage />
		</MemoryRouter>
	</QueryClientProvider>,
);

describe("PantryPage", () => {
	beforeEach(() => {
		mockHousehold.scope = { kind: "personal" };
		mockHousehold.canEdit = true;
		mockHousehold.scopeLabel = "My pantry";
		mockPantry.usePantryQuery.mockReturnValue({ data: mockPantry.data, isPending: false, isError: false, refetch: mockPantry.refetch });
		mockPantry.useCreatePantryItemMutation.mockReturnValue({ mutate: mockPantry.add, isPending: false, isError: false });
		mockPantry.useUpdatePantryItemMutation.mockReturnValue({ mutate: mockPantry.update, isPending: false });
		mockPantry.useDeletePantryItemMutation.mockReturnValue({ mutate: mockPantry.remove, isPending: false });
	});

	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it("adds an item and toggles whether it is available", () => {
	renderPage();
		fireEvent.change(screen.getByLabelText("Pantry item"), { target: { value: "Rice" } });
		fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "2" } });
		fireEvent.click(screen.getByRole("button", { name: "Add pantry item" }));
		expect(mockPantry.add).toHaveBeenCalledWith({ name: "Rice", quantity: 2, unit: "PIECE", have: true }, expect.any(Object));

		fireEvent.click(screen.getByRole("checkbox", { name: "Eggs available" }));
		expect(mockPantry.update).toHaveBeenCalledWith({ pantryId: 4, input: { have: false } });
	});

	it("passes the selected household scope to pantry reads and mutations", () => {
		mockHousehold.scope = { kind: "household", householdId: 12 };
		mockHousehold.canEdit = false;
		mockHousehold.scopeLabel = "Family pantry";
		renderPage();

		expect(mockPantry.usePantryQuery).toHaveBeenCalledWith(mockHousehold.scope);
		expect(mockPantry.useCreatePantryItemMutation).toHaveBeenCalledWith(mockHousehold.scope);
		expect(mockPantry.useUpdatePantryItemMutation).toHaveBeenCalledWith(mockHousehold.scope);
		expect(mockPantry.useDeletePantryItemMutation).toHaveBeenCalledWith(mockHousehold.scope);
		expect(screen.getByText("Family pantry")).toBeInTheDocument();
	});

	it("renders a household viewer pantry without mutation controls", () => {
		mockHousehold.scope = { kind: "household", householdId: 12 };
		mockHousehold.canEdit = false;
		mockHousehold.scopeLabel = "Family pantry";
		renderPage();

		expect(screen.getByText("Eggs")).toBeInTheDocument();
		expect(screen.queryByRole("heading", { name: "Add an ingredient" })).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Add pantry item" })).not.toBeInTheDocument();
		expect(screen.queryByRole("checkbox", { name: "Eggs available" })).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Edit Eggs" })).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Delete Eggs" })).not.toBeInTheDocument();
		expect(mockPantry.add).not.toHaveBeenCalled();
		expect(mockPantry.update).not.toHaveBeenCalled();
		expect(mockPantry.remove).not.toHaveBeenCalled();
	});

	it("shows expiry states as text and links use-soon items to recipes", () => {
		renderPage();

		expect(screen.getByText("Use soon · Expires 2026-08-30")).toBeInTheDocument();
		expect(screen.getByText("Expired · 2026-08-27. Check before using.")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Find recipes using Tomatoes" })).toHaveAttribute("href", "/food?useSoon=true");
	});

	it("submits an optional expiry date and storage location", () => {
		renderPage();
		fireEvent.change(screen.getByLabelText("Pantry item"), { target: { value: "Chicken" } });
		fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "2" } });
		fireEvent.change(screen.getByLabelText("Expires on"), { target: { value: "2026-08-31" } });
		fireEvent.change(screen.getByLabelText("Storage location"), { target: { value: "freezer" } });
		fireEvent.click(screen.getByRole("button", { name: "Add pantry item" }));

		expect(mockPantry.add).toHaveBeenCalledWith({
			name: "Chicken",
			quantity: 2,
			unit: "PIECE",
			have: true,
			expiresAt: "2026-08-31",
			storageLocation: "freezer",
		}, expect.any(Object));
	});
});
