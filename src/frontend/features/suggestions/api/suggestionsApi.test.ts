import { describe, expect, it, vi } from "vitest";
import axios from "@/shared/api/axios";
import { requestSuggestions } from "./suggestionsApi";

vi.mock("@/shared/api/axios", () => ({ default: { post: vi.fn() } }));

describe("requestSuggestions", () => {
	it("uses the public endpoint for ingredient matching", async () => {
		vi.mocked(axios.post).mockResolvedValueOnce({ data: { suggestions: [] } });

		await requestSuggestions({ intent: "ingredient_match", ingredients: ["eggs"] });

		expect(axios.post).toHaveBeenCalledWith("/suggestions", { intent: "ingredient_match", ingredients: ["eggs"] });
	});

	it("uses the authenticated endpoint for personalized suggestions", async () => {
		vi.mocked(axios.post).mockResolvedValueOnce({ data: { suggestions: [] } });

		await requestSuggestions({ intent: "personalized" });

		expect(axios.post).toHaveBeenCalledWith("/users/me/suggestions", { intent: "personalized" });
	});
});
