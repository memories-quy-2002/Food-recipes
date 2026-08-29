// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import GenerateMealPlanDialog from "./GenerateMealPlanDialog";
import type { MealPlanPreview } from "./api/planningApi";

const generate = vi.fn();
const save = vi.fn();
const preview: MealPlanPreview = {
	previewToken: "preview-token",
	name: "This week",
	from: "2026-08-24",
	to: "2026-08-30",
	targetMeals: 2,
	items: [
		{ recipeId: 1, recipeName: "Pasta", date: "2026-08-24", slot: "dinner", servings: 2, locked: false, score: 0.9, reasons: [] },
		{ recipeId: 2, recipeName: "Soup", date: "2026-08-25", slot: "dinner", servings: 2, locked: false, score: 0.8, reasons: [] },
	],
};

vi.mock("./api/planningQueries", () => ({
	useGenerateMealPlanPreviewMutation: () => ({ mutate: generate, isPending: false, error: null }),
	useCreateMealPlanFromPreviewMutation: () => ({ mutate: save, isPending: false, error: null }),
}));

describe("GenerateMealPlanDialog", () => {
	afterEach(cleanup);

	it("generates a preview without saving it automatically", () => {
		render(
			<GenerateMealPlanDialog
				open
				from="2026-08-24"
				to="2026-08-30"
				onClose={vi.fn()}
			/>,
		);

		screen.getByRole("button", { name: "Generate preview" }).click();

		expect(generate).toHaveBeenCalledOnce();
		expect(save).not.toHaveBeenCalled();
	});

	it("keeps a locked meal locked when regenerating unlocked meals", async () => {
		generate.mockImplementation((_input: unknown, options: { onSuccess?: (value: MealPlanPreview) => void }) => options.onSuccess?.(preview));
		render(
			<GenerateMealPlanDialog
				open
				from="2026-08-24"
				to="2026-08-30"
				onClose={vi.fn()}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Generate preview" }));
		await waitFor(() => expect(screen.getByRole("button", { name: "Lock Pasta" })).toBeTruthy());
		fireEvent.click(screen.getByRole("button", { name: "Lock Pasta" }));
		fireEvent.click(screen.getByRole("button", { name: "Regenerate unlocked meals" }));

		await waitFor(() => expect(screen.getByRole("button", { name: "Unlock Pasta" })).toBeTruthy());
		expect(generate).toHaveBeenLastCalledWith(expect.objectContaining({ lockedItems: [expect.objectContaining({ recipeId: 1 })] }), expect.anything());
	});
});
