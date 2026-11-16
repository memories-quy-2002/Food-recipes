// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AddMealDialog from "./AddMealDialog";

vi.mock("./RecipePicker", () => ({
	default: () => <div aria-label="Recipe picker" />,
}));

describe("AddMealDialog", () => {
	afterEach(cleanup);

	it("requires a recipe before submitting", () => {
		const onSubmit = vi.fn();
		render(
			<AddMealDialog
				open
				initialDate="2026-08-24"
				initialSlot="dinner"
				onClose={vi.fn()}
				onSubmit={onSubmit}
				isSubmitting={false}
			/>,
		);

		expect(screen.getByLabelText("Date")).toHaveProperty("value", "2026-08-24");
		expect(screen.getByLabelText("Meal")).toHaveProperty("value", "dinner");
		expect(screen.getByLabelText("Servings")).toHaveProperty("value", "4");

		fireEvent.click(screen.getByRole("button", { name: "Add to plan" }));

		expect(screen.getByRole("alert").textContent).toContain("Choose a recipe first.");
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("uses Save changes when editing an existing item", () => {
		render(
			<AddMealDialog
				open
				initialDate="2026-08-24"
				initialSlot="dinner"
				item={{
					item_id: 4,
					plan_id: 12,
					recipe_id: 7,
					recipe_name: "Chicken Curry",
					planned_date: "2026-08-24",
					slot: "dinner",
					servings: 4,
					created_at: "2026-08-24T00:00:00.000Z",
				}}
				onClose={vi.fn()}
				onSubmit={vi.fn()}
				isSubmitting={false}
			/>,
		);

		expect(screen.getByRole("button", { name: "Save changes" })).toBeTruthy();
	});

	it("restores page scrolling after rerenders while the dialog is open", () => {
		document.body.style.overflow = "";
		const props = {
			open: true,
			initialDate: "2026-08-24",
			initialSlot: "dinner" as const,
			onClose: vi.fn(),
			onSubmit: vi.fn(),
			isSubmitting: false,
		};
		const { rerender } = render(<AddMealDialog {...props} />);
		expect(document.body.style.overflow).toBe("hidden");

		rerender(<AddMealDialog {...props} onClose={vi.fn()} isSubmitting />);
		rerender(<AddMealDialog {...props} onClose={vi.fn()} open={false} />);

		expect(document.body.style.overflow).toBe("");
		document.body.style.overflow = "";
	});
});
