// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
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
		vi.restoreAllMocks();
		vi.clearAllMocks();
	});

	it("adds an item and toggles whether it is available", () => {
	renderPage();
		fireEvent.change(screen.getByLabelText("Pantry item"), { target: { value: "Rice" } });
		fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "2" } });
		fireEvent.click(screen.getByRole("button", { name: "Add pantry item" }));
		expect(mockPantry.add).toHaveBeenCalledWith({ name: "Rice", quantity: 2, unit: "PIECE", have: true, expiresAt: null }, expect.any(Object));

		fireEvent.click(screen.getByRole("checkbox", { name: "Have any Eggs" }));
		expect(mockPantry.update).toHaveBeenCalledWith({ pantryId: 4, input: { have: false } }, expect.objectContaining({ onError: expect.any(Function) }));
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
		expect(screen.queryByRole("checkbox", { name: "Have any Eggs" })).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Edit Eggs" })).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Delete Eggs" })).not.toBeInTheDocument();
		expect(mockPantry.add).not.toHaveBeenCalled();
		expect(mockPantry.update).not.toHaveBeenCalled();
		expect(mockPantry.remove).not.toHaveBeenCalled();
	});

	it("shows expiry status and links a use-soon ingredient to recipe search", () => {
		renderPage();

		expect(screen.getByText("4 pc")).toBeInTheDocument();
		expect(screen.getByText("Use soon · Expires 2026-08-30")).toBeInTheDocument();
		expect(screen.getByText("Expired · 2026-08-27. Check before using.")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Find recipes using Tomatoes" })).toHaveAttribute("href", "/food?q=Tomatoes&pantryIngredient=Tomatoes");
	});

	it("allows adding an expiry date to a pantry item", () => {
		renderPage();

		fireEvent.change(screen.getByLabelText("Expires on (optional)"), { target: { value: "2026-12-01" } });
		fireEvent.change(screen.getByLabelText("Pantry item"), { target: { value: "Chicken" } });
		fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "2" } });
		fireEvent.click(screen.getByRole("button", { name: "Add pantry item" }));

		expect(mockPantry.add).toHaveBeenCalledWith(expect.objectContaining({ name: "Chicken", expiresAt: "2026-12-01" }), expect.any(Object));
	});

	it("submits pantry item quantity and expiry fields", () => {
		renderPage();
		fireEvent.change(screen.getByLabelText("Pantry item"), { target: { value: "Chicken" } });
		fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "2" } });
		fireEvent.change(screen.getByLabelText("Unit"), { target: { value: "GRAM" } });
		fireEvent.change(screen.getByLabelText("Expires on (optional)"), { target: { value: "2026-12-01" } });
		fireEvent.click(screen.getByRole("button", { name: "Add pantry item" }));

		expect(mockPantry.add).toHaveBeenCalledWith({
			name: "Chicken",
			quantity: 2,
			unit: "GRAM",
			have: true,
			expiresAt: "2026-12-01",
		}, expect.any(Object));
	});

	it("filters inventory by ingredient and stock status", () => {
		renderPage();

		fireEvent.change(screen.getByLabelText("Search pantry"), { target: { value: "milk" } });
		expect(screen.getByText("Milk")).toBeInTheDocument();
		expect(screen.queryByText("Eggs")).not.toBeInTheDocument();

		fireEvent.change(screen.getByLabelText("Filter pantry"), { target: { value: "missing" } });
		expect(screen.getByRole("status")).toHaveTextContent("No pantry items match this search and filter");
	});

	it("offers a clear action when search and filters return no pantry items", () => {
		renderPage();
		fireEvent.change(screen.getByLabelText("Search pantry"), { target: { value: "saffron" } });

		expect(screen.getByRole("status")).toHaveTextContent("No pantry items match");
		fireEvent.click(screen.getByRole("button", { name: "Clear search and filters" }));
		expect(screen.getByLabelText("Search pantry")).toHaveValue("");
		expect(screen.getByLabelText("Filter pantry")).toHaveValue("all");
		expect(screen.getByText("Eggs")).toBeInTheDocument();
	});

	it("shows available stock separately from items that need quantity details", () => {
		mockPantry.usePantryQuery.mockReturnValue({
			data: { items: [
				{ pantry_id: 4, name: "Eggs", have: true, quantity: 12, unit: "PIECE" },
				{ pantry_id: 7, name: "Flour", have: true, quantity: null, unit: null },
				{ pantry_id: 8, name: "Water", have: true, quantity: 0, unit: "LITER" },
				{ pantry_id: 9, name: "Salt", have: false, quantity: 0, unit: "GRAM" },
			] },
			isPending: false,
			isError: false,
			refetch: mockPantry.refetch,
		});
		renderPage();

		const overview = within(screen.getByRole("region", { name: "Pantry overview" }));
		expect(overview.getByText("On hand").parentElement?.parentElement).toHaveTextContent("1");
		expect(screen.getByRole("heading", { name: "Needs details" })).toBeInTheDocument();
		expect(screen.getByText("Flour")).toBeInTheDocument();
		expect(screen.getByText("Water")).toBeInTheDocument();
		expect(screen.getByText("Salt")).toBeInTheDocument();
		expect(screen.getByRole("checkbox", { name: "Have any Flour" })).toBeChecked();
	});

	it("keeps edit, availability, and delete errors visible to the user", async () => {
		const update = vi.fn((_input: unknown, options?: { onError?: () => void }) => options?.onError?.());
		const remove = vi.fn((_id: number, options?: { onError?: () => void }) => options?.onError?.());
		vi.spyOn(window, "confirm").mockReturnValue(true);
		mockPantry.useUpdatePantryItemMutation.mockReturnValue({ mutate: update, isPending: false });
		mockPantry.useDeletePantryItemMutation.mockReturnValue({ mutate: remove, isPending: false });
		renderPage();

		fireEvent.click(screen.getByRole("checkbox", { name: "Have any Eggs" }));
		expect(screen.getByRole("alert")).toHaveTextContent("could not update Eggs");

		fireEvent.click(screen.getByRole("button", { name: "Edit Eggs" }));
		fireEvent.click(screen.getByRole("button", { name: "Save Eggs" }));
		expect(update).toHaveBeenCalledWith(expect.objectContaining({ pantryId: 4, input: expect.objectContaining({ have: true }) }), expect.objectContaining({ onError: expect.any(Function) }));
		expect(screen.getByRole("alert")).toHaveTextContent("could not save Eggs");

		fireEvent.click(screen.getByRole("button", { name: "Delete Eggs" }));
		expect(screen.getByRole("alert")).toHaveTextContent("could not delete Eggs");
	});

	it("does not mark zero quantity as usable stock when adding", () => {
		renderPage();
		fireEvent.change(screen.getByLabelText("Pantry item"), { target: { value: "Empty jar" } });
		fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "0" } });
		fireEvent.click(screen.getByRole("button", { name: "Add pantry item" }));

		expect(mockPantry.add).toHaveBeenCalledWith(expect.objectContaining({ name: "Empty jar", quantity: 0, have: false }), expect.any(Object));
	});

	it("requires a supported unit before a legacy item can become usable stock", () => {
		mockPantry.usePantryQuery.mockReturnValue({
			data: { items: [{ pantry_id: 10, name: "Flour", have: true, quantity: null, unit: null }] },
			isPending: false,
			isError: false,
			refetch: mockPantry.refetch,
		});
		renderPage();
		fireEvent.click(screen.getByRole("button", { name: "Edit Flour" }));
		const editForm = screen.getByRole("form", { name: "Edit Flour" });
		fireEvent.change(within(editForm).getByLabelText("Quantity"), { target: { value: "250" } });
		fireEvent.click(within(editForm).getByRole("button", { name: "Save Flour" }));

		expect(screen.getByRole("alert")).toHaveTextContent("Choose a supported unit");
		expect(mockPantry.update).not.toHaveBeenCalled();

		fireEvent.change(within(editForm).getByLabelText("Unit"), { target: { value: "GRAM" } });
		fireEvent.click(within(editForm).getByRole("button", { name: "Save Flour" }));
		expect(mockPantry.update).toHaveBeenCalledWith(expect.objectContaining({ pantryId: 10, input: expect.objectContaining({ quantity: 250, unit: "GRAM", have: true }) }), expect.any(Object));
	});

	it("does not delete an ingredient when the confirmation is canceled", () => {
		vi.spyOn(window, "confirm").mockReturnValue(false);
		renderPage();
		fireEvent.click(screen.getByRole("button", { name: "Delete Eggs" }));

		expect(window.confirm).toHaveBeenCalledWith("Delete Eggs from this pantry?");
		expect(mockPantry.remove).not.toHaveBeenCalled();
	});

	it("disables pantry controls while a matching mutation is pending", () => {
		mockPantry.useUpdatePantryItemMutation.mockReturnValue({ mutate: mockPantry.update, isPending: true });
		mockPantry.useDeletePantryItemMutation.mockReturnValue({ mutate: mockPantry.remove, isPending: true });
		renderPage();

		expect(screen.getByRole("checkbox", { name: "Have any Eggs" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Edit Eggs" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Delete Eggs" })).toBeDisabled();
	});
});
