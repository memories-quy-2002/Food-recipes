// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
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
}));

vi.mock("./api/pantryQueries", () => ({
	usePantryQuery: () => ({ data: mockPantry.data, isPending: false, isError: false, refetch: vi.fn() }),
	useCreatePantryItemMutation: () => ({ mutate: mockPantry.add, isPending: false, isError: false }),
	useUpdatePantryItemMutation: () => ({ mutate: mockPantry.update, isPending: false }),
	useDeletePantryItemMutation: () => ({ mutate: mockPantry.remove, isPending: false }),
}));

const renderPage = () => render(
	<QueryClientProvider client={new QueryClient()}>
		<MemoryRouter>
			<PantryPage />
		</MemoryRouter>
	</QueryClientProvider>,
);

describe("PantryPage", () => {
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
