import { describe, expect, it, vi } from "vitest";
import axios from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";
import { dismissRecommendation, restoreRecommendation } from "./recommendationsApi";

vi.mock("@/shared/api/axios", () => ({
	default: { put: vi.fn(), delete: vi.fn() },
}));

describe("recommendationsApi", () => {
	it("marks an authenticated user's recipe as not interested", async () => {
		vi.mocked(axios.put).mockResolvedValueOnce({ data: { message: "ok" } } as never);

		await expect(dismissRecommendation(42)).resolves.toEqual({ message: "ok" });
		expect(axios.put).toHaveBeenCalledWith(apiRoutes.userRecommendationNotInterested(42));
	});

	it("restores an authenticated user's recipe recommendation", async () => {
		vi.mocked(axios.delete).mockResolvedValueOnce({ data: { message: "ok" } } as never);

		await expect(restoreRecommendation(42)).resolves.toEqual({ message: "ok" });
		expect(axios.delete).toHaveBeenCalledWith(apiRoutes.userRecommendationNotInterested(42));
	});
});
