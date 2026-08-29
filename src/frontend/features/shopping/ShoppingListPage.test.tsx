// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ShoppingListPage from "./ShoppingListPage";

const mockShopping = vi.hoisted(() => ({
	data: null as unknown,
	isPending: false,
	isError: false,
	error: null,
	refetch: vi.fn(),
	add: vi.fn(),
	update: vi.fn(),
	remove: vi.fn(),
	clear: vi.fn(),
	importRecipe: vi.fn(),
	importPlanned: vi.fn(),
	importToPantry: vi.fn(),
}));

vi.mock("./api/shoppingQueries", () => ({
	useShoppingListQuery: () => mockShopping,
	useAddShoppingItemMutation: () => ({ mutate: mockShopping.add, isPending: false, isError: false }),
	useUpdateShoppingItemMutation: () => ({ mutate: mockShopping.update, isPending: false, isError: false }),
	useDeleteShoppingItemMutation: () => ({ mutate: mockShopping.remove, isPending: false, isError: false }),
	useClearCompletedShoppingItemsMutation: () => ({ mutate: mockShopping.clear, isPending: false, isError: false }),
	useAddRecipeIngredientsMutation: () => ({ mutate: mockShopping.importRecipe, isPending: false, isError: false }),
	useAddRecipeIngredientsFromRecipesMutation: () => ({ mutate: mockShopping.importPlanned, isPending: false, isError: false }),
	useImportCheckedShoppingItemsMutation: () => ({ mutate: mockShopping.importToPantry, isPending: false, isError: false }),
}));

vi.mock("@/features/planning/api/planningQueries", () => ({
	useMealPlanForWeekQuery: () => ({ data: null, isPending: false, isError: false }),
}));

const renderPage = () => {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});

	return render(
		<QueryClientProvider client={queryClient}>
			<MemoryRouter initialEntries={["/shopping-list"]}>
				<ShoppingListPage />
			</MemoryRouter>
		</QueryClientProvider>,
	);
};

describe("ShoppingListPage", () => {
	beforeEach(() => {
		mockShopping.data = null;
		mockShopping.isPending = false;
		mockShopping.isError = false;
		mockShopping.error = null;
		mockShopping.refetch.mockReset();
		mockShopping.add.mockReset();
		mockShopping.update.mockReset();
		mockShopping.remove.mockReset();
		mockShopping.clear.mockReset();
		mockShopping.importRecipe.mockReset();
		mockShopping.importPlanned.mockReset();
		mockShopping.importToPantry.mockReset();
	});

	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it("shows an actionable loading state", () => {
		mockShopping.isPending = true;
		renderPage();

		expect(screen.getByRole("status", { name: "Loading your shopping list" })).toBeTruthy();
	});

	it("shows an actionable empty state and keeps the manual add form available", () => {
		mockShopping.data = { items: [] };
		renderPage();

		expect(screen.getByRole("heading", { name: "Your shopping list is empty" })).toBeTruthy();
		expect(screen.getByRole("link", { name: "Browse recipes" }).getAttribute("href")).toBe("/food");
		expect(screen.getByRole("button", { name: "Add item" })).toBeTruthy();
	});

	it("adds, checks, edits, deletes, and clears shopping items", () => {
		mockShopping.data = {
			items: [
				{
					item_id: 1,
					label: "2 eggs",
					quantity: "large",
					source_recipe_id: 7,
					source_recipe_name: "Chicken Curry",
					checked: false,
				},
				{
					item_id: 2,
					label: "olive oil",
					quantity: null,
					source_recipe_id: null,
					source_recipe_name: null,
					checked: true,
				},
			],
		};
		renderPage();

		expect(screen.getByRole("heading", { name: "Shopping List" })).toBeTruthy();
		expect(screen.getByRole("heading", { name: "To buy" })).toBeTruthy();
		expect(screen.getByRole("heading", { name: "Completed" })).toBeTruthy();
		expect(screen.getByRole("link", { name: "From Chicken Curry" }).getAttribute("href")).toBe("/recipe?id=7");

		fireEvent.change(screen.getByLabelText("Item"), { target: { value: "milk" } });
		fireEvent.change(screen.getByLabelText(/Quantity/), { target: { value: "1 carton" } });
		fireEvent.click(screen.getByRole("button", { name: "Add item" }));
		expect(mockShopping.add).toHaveBeenCalledWith(
			{ label: "milk", quantity: "1 carton" },
			expect.any(Object),
		);

		fireEvent.click(screen.getByRole("checkbox", { name: "Mark 2 eggs as purchased" }));
		expect(mockShopping.update).toHaveBeenCalledWith({ itemId: 1, input: { checked: true } });

		fireEvent.click(screen.getByRole("button", { name: "Edit 2 eggs" }));
		fireEvent.change(screen.getByDisplayValue("2 eggs"), { target: { value: "3 eggs" } });
		fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
		expect(mockShopping.update).toHaveBeenCalledWith({
			itemId: 1,
			input: { label: "3 eggs", quantity: "large" },
		});

		fireEvent.click(screen.getByRole("button", { name: "Delete olive oil" }));
		expect(mockShopping.remove).toHaveBeenCalledWith(2);

		fireEvent.click(screen.getByRole("button", { name: "Clear completed" }));
		expect(mockShopping.clear).toHaveBeenCalledTimes(1);

		fireEvent.click(screen.getByRole("button", { name: "Add purchased items to pantry" }));
		expect(mockShopping.importToPantry).toHaveBeenCalledTimes(1);
	});

	it("offers a retry when the list fails to load", () => {
		mockShopping.isError = true;
		renderPage();

		fireEvent.click(screen.getByRole("button", { name: "Try again" }));
		expect(mockShopping.refetch).toHaveBeenCalledTimes(1);
	});
});
