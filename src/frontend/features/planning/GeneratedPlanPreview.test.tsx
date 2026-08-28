// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import GeneratedPlanPreview from "./GeneratedPlanPreview";
import type { MealPlanPreview } from "./api/planningApi";

const preview: MealPlanPreview = {
	previewToken: "preview-token",
	name: "This week",
	from: "2026-08-24",
	to: "2026-08-30",
	targetMeals: 2,
	items: [
		{ recipeId: 1, recipeName: "Pasta", date: "2026-08-24", slot: "dinner", servings: 2, locked: false, score: 0.9, reasons: [] },
		{ recipeId: 2, recipeName: "Soup", date: "2026-08-25", slot: "dinner", servings: 2, locked: true, score: 0.8, reasons: [] },
	],
};

describe("GeneratedPlanPreview", () => {
	it("keeps mobile actions explicit without relying on drag and drop", () => {
		const onSwap = vi.fn();
		const onToggleLock = vi.fn();
		const onRegenerate = vi.fn();
		const onSave = vi.fn();

		render(
			<GeneratedPlanPreview
				preview={preview}
				onSwap={onSwap}
				onToggleLock={onToggleLock}
				onRegenerate={onRegenerate}
				onSave={onSave}
				onCancel={vi.fn()}
			/>,
		);

		screen.getByRole("button", { name: "Swap Pasta" }).click();
		screen.getByRole("button", { name: "Lock Pasta" }).click();
		screen.getByRole("button", { name: "Regenerate unlocked meals" }).click();
		screen.getByRole("button", { name: "Save meal plan" }).click();

		expect(onSwap).toHaveBeenCalledWith(preview.items[0]);
		expect(onToggleLock).toHaveBeenCalledWith(preview.items[0]);
		expect(onRegenerate).toHaveBeenCalledOnce();
		expect(onSave).toHaveBeenCalledOnce();
	});
});
