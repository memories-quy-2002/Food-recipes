import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "@/shared/api/axios";
import { householdScope } from "@/features/households/householdScope";
import { createLeftover, listLeftovers } from "./leftoversApi";

vi.mock("@/shared/api/axios", () => ({
	default: {
		get: vi.fn(),
		post: vi.fn(),
	},
}));

const mockedAxios = vi.mocked(axios);

describe("leftovers API", () => {
	beforeEach(() => vi.clearAllMocks());

	it("lists personal leftovers using the authenticated route", async () => {
		mockedAxios.get.mockResolvedValueOnce({ data: { items: [] } });

		await listLeftovers({ kind: "personal" });

		expect(mockedAxios.get).toHaveBeenCalledWith("/users/me/leftovers", {
			signal: undefined,
		});
	});

	it("lists and creates household leftovers with the backend payload", async () => {
		const scope = householdScope(22);
		mockedAxios.get.mockResolvedValueOnce({ data: { items: [] } });
		mockedAxios.post.mockResolvedValueOnce({ data: { leftover: { leftover_id: 8 } } });

		await listLeftovers(scope, new AbortController().signal);
		await createLeftover(scope, {
			cookingHistoryId: 4,
			servings: 2,
			expiresAt: "2026-09-02T23:59:59.000Z",
		});

		expect(mockedAxios.get).toHaveBeenCalledWith("/households/22/leftovers", {
			signal: expect.any(AbortSignal),
		});
		expect(mockedAxios.post).toHaveBeenCalledWith("/households/22/leftovers", {
			cookingHistoryId: 4,
			servings: 2,
			expiresAt: "2026-09-02T23:59:59.000Z",
		});
	});
});
