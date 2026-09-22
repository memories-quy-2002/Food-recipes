import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "@/shared/api/axios";
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

});
