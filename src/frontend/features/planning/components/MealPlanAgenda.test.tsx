// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { getWeekRange } from "../api/planningDates";
import MealPlanAgenda from "./MealPlanAgenda";

describe("MealPlanAgenda", () => {
	it("keeps every empty meal slot droppable", () => {
		const range = getWeekRange(new Date("2026-08-26T12:00:00Z"));

		render(
			<MemoryRouter>
				<MealPlanAgenda
					days={range.days}
					items={[]}
					onAdd={vi.fn()}
					onEdit={vi.fn()}
					onRemove={vi.fn()}
				/>
			</MemoryRouter>,
		);

		expect(screen.getAllByRole("button", { name: /Add recipe to/ })).toHaveLength(28);
	});
});
