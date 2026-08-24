import { describe, expect, it } from "vitest";
import { getWeekRange, getWeekdayLabel, toIsoDate } from "./planningDates";

describe("planning date helpers", () => {
	 it("returns a Monday-Sunday range without timezone drift", () => {
		expect(getWeekRange(new Date("2026-08-26T12:00:00Z"))).toMatchObject({
			from: "2026-08-24",
			to: "2026-08-30",
		});
	});

	it("creates stable ISO dates for a local calendar day", () => {
		expect(toIsoDate(new Date(2026, 7, 24, 23, 45))).toBe("2026-08-24");
	});

	it("labels weekdays with the product locale", () => {
		expect(getWeekdayLabel("2026-08-24")).toBe("Monday");
	});
});
