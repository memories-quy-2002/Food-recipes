import { afterEach, describe, expect, it, vi } from "vitest";
import axios from "@/shared/api/axios";
import {
	clearAccessToken,
	getAccessToken,
} from "@/features/auth/state/authTokenStore";
import { apiRoutes } from "@/shared/api/routes";
import { AUTH_REFRESH_TIMEOUT_MS, authSessionApi } from "./authSessionApi";

vi.mock("@/shared/api/axios", () => ({
	default: { post: vi.fn() },
}));

afterEach(() => {
	clearAccessToken();
	vi.restoreAllMocks();
});

describe("authSessionApi", () => {
	it("refreshes through the HttpOnly-cookie endpoint and keeps the access token in memory", async () => {
		const user = { user_id: 7, full_name: "Smoke User" };
		axios.post.mockResolvedValue({ data: { user, token: "fresh-token" } });

		await expect(authSessionApi.refresh()).resolves.toEqual({ user, token: "fresh-token" });
		expect(axios.post).toHaveBeenCalledWith(apiRoutes.authRefresh, {}, { timeout: AUTH_REFRESH_TIMEOUT_MS });
		expect(getAccessToken()).toBe("fresh-token");
	});

	it("rejects malformed refresh responses without accepting a missing token", async () => {
		axios.post.mockResolvedValue({ data: { user: { user_id: 7 } } });

		await expect(authSessionApi.refresh()).rejects.toMatchObject({ code: "AUTH_REFRESH_INVALID" });
		expect(getAccessToken()).toBeNull();
	});

	it("logs out through the server endpoint", async () => {
		axios.post.mockResolvedValue({ data: { message: "Logged out" } });

		await authSessionApi.logout();

		expect(axios.post).toHaveBeenCalledWith(apiRoutes.authLogout, {});
	});
});
