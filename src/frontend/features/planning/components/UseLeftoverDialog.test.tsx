// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import UseLeftoverDialog from "./UseLeftoverDialog";

const mockPlanning = vi.hoisted(() => ({
	leftovers: [{ leftover_id: 8, recipe_name: "Tomato Soup", remaining_servings: 3 }],
	add: vi.fn(),
}));

vi.mock("@/features/leftovers/api/leftoversQueries", () => ({
	useLeftoversQuery: () => ({ data: { items: mockPlanning.leftovers }, isPending: false, isError: false }),
}));
vi.mock("../api/planningQueries", () => ({
	useAddLeftoverMealPlanItemMutation: () => ({ mutate: mockPlanning.add, isPending: false, isError: false }),
	useCreateMealPlanMutation: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
}));

describe("UseLeftoverDialog", () => {
	it("adds a selected leftover with editable date, slot, and portions", () => {
		render(
			<UseLeftoverDialog
				open
				initialDate="2026-08-31"
				scope={{ kind: "personal" }}
				activePlan={{ plan_id: 12 }}
				onClose={vi.fn()}
			/>,
		);

		fireEvent.click(screen.getByRole("option", { name: /Tomato Soup/i }));
		fireEvent.change(screen.getByLabelText("Meal"), { target: { value: "lunch" } });
		fireEvent.change(screen.getByLabelText("Servings"), { target: { value: "2" } });
		fireEvent.click(screen.getByRole("button", { name: "Add leftover to plan" }));

		expect(mockPlanning.add).toHaveBeenCalledWith(
			{
				planId: 12,
				input: { leftoverBatchId: 8, date: "2026-08-31", slot: "lunch", servings: 2 },
			},
			expect.any(Object),
		);
	});
});
