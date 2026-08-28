// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { trackProductEvent } from "./productAnalytics";

describe("product analytics", () => {
	it("emits only safe funnel payload fields", () => {
		const dispatch = vi.spyOn(window, "dispatchEvent");
		trackProductEvent("notification_opened", { surface: "header", notification_id: 4, email: "private@example.com" } as never);
		const detail = (dispatch.mock.calls[0][0] as CustomEvent).detail;
		expect(detail).toEqual({ event: "notification_opened", surface: "header" });
		dispatch.mockRestore();
	});
});
