// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import GenerateMealPlanDialog from "./GenerateMealPlanDialog";

const generate = vi.fn();
const save = vi.fn();

vi.mock("./api/planningQueries", () => ({
	useGenerateMealPlanPreviewMutation: () => ({ mutate: generate, isPending: false, error: null }),
	useCreateMealPlanFromPreviewMutation: () => ({ mutate: save, isPending: false, error: null }),
}));

describe("GenerateMealPlanDialog", () => {
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
});
