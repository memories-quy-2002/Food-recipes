// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import PantryPage from "./PantryPage";

const mockPantry = vi.hoisted(() => ({
	data: { items: [{ pantry_id: 4, name: "Eggs", have: true }] },
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
		fireEvent.click(screen.getByRole("button", { name: "Add pantry item" }));
		expect(mockPantry.add).toHaveBeenCalledWith({ name: "Rice", have: true }, expect.any(Object));

		fireEvent.click(screen.getByRole("checkbox", { name: "Eggs available" }));
		expect(mockPantry.update).toHaveBeenCalledWith({ pantryId: 4, input: { have: false } });
	});
});
