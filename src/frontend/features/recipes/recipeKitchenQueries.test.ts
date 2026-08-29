// @vitest-environment jsdom

import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { refreshKitchenQueries } from "./recipeKitchenQueries";

describe("refreshKitchenQueries", () => {
	it("invalidates pantry data after cooking completes", async () => {
		const queryClient = new QueryClient();
		const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue(undefined);

		await refreshKitchenQueries(queryClient);

		expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["pantry"] });
	});
});
