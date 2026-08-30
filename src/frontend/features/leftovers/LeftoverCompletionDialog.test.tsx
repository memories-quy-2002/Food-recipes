// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LeftoverCompletionDialog from "./LeftoverCompletionDialog";

describe("LeftoverCompletionDialog", () => {
	it("shows cooked servings, converts eaten servings to remaining, and exposes planning fields", () => {
		const onSave = vi.fn().mockResolvedValue(undefined);

		render(
			<LeftoverCompletionDialog
				open
				recipeName="Tomato Soup"
				cookedServings={4}
				onClose={vi.fn()}
				onSave={onSave}
			/>,
		);

		expect(screen.getByRole("dialog", { name: "Save Tomato Soup leftovers" })).toBeTruthy();
		expect(screen.getByLabelText("Cooked servings")).toHaveProperty("value", "4");
		fireEvent.click(screen.getByLabelText("Eaten servings"));
		fireEvent.change(screen.getByLabelText("Eaten servings amount"), { target: { value: "1" } });
		fireEvent.click(screen.getByLabelText("Add to tomorrow's lunch"));
		fireEvent.click(screen.getByRole("button", { name: "Save leftover" }));

		expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
			remainingServings: 3,
			planDate: expect.any(String),
			slot: "lunch",
		}));
	});
});
