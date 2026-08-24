// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import WeekNavigator from "./WeekNavigator";
import { getWeekRange } from "../api/planningDates";

describe("WeekNavigator", () => {
	it("exposes labelled controls and the visible range", () => {
		const range = getWeekRange(new Date("2026-08-26T12:00:00Z"));
		render(
			<WeekNavigator
				range={range}
				onPrevious={vi.fn()}
				onNext={vi.fn()}
				isCurrentWeek={false}
			/>,
		);

		expect(screen.getByRole("button", { name: "Previous week" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Next week" })).toBeTruthy();
		expect(screen.getByText("Aug 24 – Aug 30")).toBeTruthy();
	});
});
