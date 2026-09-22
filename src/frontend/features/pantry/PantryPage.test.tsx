// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PantryPage from "./PantryPage";

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



	it("keeps ingredient rows focused on quantity", () => {
		renderPage();

		expect(screen.getByText("4 pc")).toBeInTheDocument();
		expect(screen.queryByText("Use soon · Expires 2026-08-30")).not.toBeInTheDocument();
		expect(screen.queryByText("Expired · 2026-08-27. Check before using.")).not.toBeInTheDocument();
		expect(screen.queryByRole("link", { name: "Find recipes using Tomatoes" })).not.toBeInTheDocument();
	});

	it("does not render removed expiry or storage controls", () => {
		renderPage();

		expect(screen.queryByLabelText("Expires on")).not.toBeInTheDocument();
		expect(screen.queryByLabelText("Storage location")).not.toBeInTheDocument();
		expect(screen.queryByText("No expiry date set")).not.toBeInTheDocument();
		expect(screen.queryByRole("link", { name: "Find recipes using Tomatoes" })).not.toBeInTheDocument();
	});

	it("submits the minimal pantry item fields", () => {
		renderPage();
		fireEvent.change(screen.getByLabelText("Pantry item"), { target: { value: "Chicken" } });
		fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "2" } });
		fireEvent.change(screen.getByLabelText("Unit"), { target: { value: "GRAM" } });
		fireEvent.click(screen.getByRole("button", { name: "Add pantry item" }));

		expect(mockPantry.add).toHaveBeenCalledWith({
			name: "Chicken",
			quantity: 2,
			unit: "GRAM",
			have: true,
		}, expect.any(Object));
	});

	it("filters inventory by ingredient and stock status", () => {
		renderPage();

		fireEvent.change(screen.getByLabelText("Search pantry"), { target: { value: "milk" } });
		expect(screen.getByText("Milk")).toBeInTheDocument();
		expect(screen.queryByText("Eggs")).not.toBeInTheDocument();

		fireEvent.change(screen.getByLabelText("Filter pantry"), { target: { value: "missing" } });
		expect(screen.getByText("No available items match this filter.")).toBeInTheDocument();
	});
});
