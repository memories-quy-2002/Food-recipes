// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AddToPlanDialog from "./AddToPlanDialog";

const mockPlanning = vi.hoisted(() => ({
	week: { plan: { plan_id: 12 }, items: [] } as unknown,
	isPending: false,
	isError: false,
	refetch: vi.fn(),
	create: vi.fn(),
	add: vi.fn(),
}));

vi.mock("../api/planningQueries", () => ({
	useMealPlanForWeekQuery: () => ({
		data: mockPlanning.week,
		isPending: mockPlanning.isPending,
		isError: mockPlanning.isError,
		refetch: mockPlanning.refetch,
	}),
	useCreateMealPlanMutation: () => ({ mutate: mockPlanning.create, isPending: false, isError: false }),
	useAddMealPlanItemMutation: () => ({ mutate: mockPlanning.add, isPending: false, isError: false }),
}));

const recipe = { recipe_id: 7, recipe_name: "Chicken Curry" };

const renderDialog = (overrides: Record<string, unknown> = {}) =>
	render(
		<AddToPlanDialog
			open
			recipe={recipe}
			onClose={vi.fn()}
			onAdded={vi.fn()}
			{...overrides}
		/>,
	);

describe("AddToPlanDialog", () => {
	beforeEach(() => {
		mockPlanning.week = { plan: { plan_id: 12 }, items: [] };
		mockPlanning.isPending = false;
		mockPlanning.isError = false;
		mockPlanning.refetch.mockReset();
		mockPlanning.create.mockReset();
		mockPlanning.add.mockReset();
	});

	afterEach(cleanup);

	it("submits the recipe to the existing week plan with editable defaults", () => {
		renderDialog();

		expect(screen.getByRole("heading", { name: "Add Chicken Curry to your plan" })).toBeTruthy();
		expect(screen.getByLabelText("Meal")).toHaveProperty("value", "dinner");
		expect(screen.getByLabelText("Servings")).toHaveProperty("value", "4");

		fireEvent.change(screen.getByLabelText("Meal"), { target: { value: "lunch" } });
		fireEvent.change(screen.getByLabelText("Servings"), { target: { value: "6" } });
		fireEvent.click(screen.getByRole("button", { name: "Add to plan" }));

		expect(mockPlanning.add).toHaveBeenCalledWith(
			{
				planId: 12,
				input: expect.objectContaining({ recipeId: 7, slot: "lunch", servings: 6 }),
			},
			expect.any(Object),
		);
	});

	it("creates the selected week plan before adding when no plan exists", () => {
		mockPlanning.week = null;
		mockPlanning.create.mockImplementation((_input, options) =>
			options.onSuccess({ plan: { plan_id: 21 } }),
		);
		renderDialog();

		fireEvent.click(screen.getByRole("button", { name: "Add to plan" }));

		expect(mockPlanning.create).toHaveBeenCalledWith(
			expect.objectContaining({ name: "This week" }),
			expect.any(Object),
		);
		expect(mockPlanning.add).toHaveBeenCalledWith(
			expect.objectContaining({ planId: 21 }),
			expect.any(Object),
		);
	});

	it("requires a recipe and valid servings", () => {
		renderDialog({ recipe: null });
		fireEvent.click(screen.getByRole("button", { name: "Add to plan" }));
		expect(screen.getByRole("alert").textContent).toContain("Choose a recipe first.");
		expect(mockPlanning.add).not.toHaveBeenCalled();

		cleanup();
		renderDialog();
		fireEvent.change(screen.getByLabelText("Servings"), { target: { value: "25" } });
		fireEvent.click(screen.getByRole("button", { name: "Add to plan" }));
		expect(screen.getByRole("alert").textContent).toContain("between 1 and 24");
	});

	it("shows an actionable plan loading error", () => {
		mockPlanning.isError = true;
		renderDialog();

		expect(screen.getByRole("alert").textContent).toContain("plan details");
		fireEvent.click(screen.getByRole("button", { name: "Try again" }));
		expect(mockPlanning.refetch).toHaveBeenCalledTimes(1);
	});
});
