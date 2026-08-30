import { AxiosHeaders, type AxiosResponse } from "axios";
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

const postMock = vi.mocked(axios.post);

const createResponse = <T,>(data: T): AxiosResponse<T> => ({
	data,
	status: 200,
	statusText: "OK",
	headers: new AxiosHeaders(),
	config: { headers: new AxiosHeaders() },
});

afterEach(() => {
	clearAccessToken();
	postMock.mockReset();
	vi.restoreAllMocks();
});

describe("authSessionApi", () => {
	it("refreshes through the HttpOnly-cookie endpoint and keeps the access token in memory", async () => {
		const user = { user_id: 7, full_name: "Smoke User" };
		postMock.mockResolvedValue(
			createResponse({ user, token: "fresh-token" }),
		);

		await expect(authSessionApi.refresh()).resolves.toEqual({ user, token: "fresh-token" });
		expect(postMock).toHaveBeenCalledWith(
			apiRoutes.authRefresh,
			{},
			{ timeout: AUTH_REFRESH_TIMEOUT_MS },
		);
		expect(getAccessToken()).toBe("fresh-token");
	});

	it("rejects malformed refresh responses without accepting a missing token", async () => {
		postMock.mockResolvedValue(
			createResponse({ user: { user_id: 7 } }),
		);

		await expect(authSessionApi.refresh()).rejects.toMatchObject({
			code: "AUTH_REFRESH_INVALID",
		});
		expect(getAccessToken()).toBeNull();
	});

	it("shares one refresh request across concurrent session bootstraps", async () => {
		const user = { user_id: 7, full_name: "Smoke User" };
		postMock.mockResolvedValue(
			createResponse({ user, token: "fresh-token" }),
		);

		await expect(Promise.all([authSessionApi.refresh(), authSessionApi.refresh()])).resolves.toEqual([
			{ user, token: "fresh-token" },
			{ user, token: "fresh-token" },
		]);
		expect(postMock).toHaveBeenCalledTimes(1);
	});

	it("logs out through the server endpoint", async () => {
		postMock.mockResolvedValue(
			createResponse({ message: "Logged out" }),
		);

		await authSessionApi.logout();

		expect(postMock).toHaveBeenCalledWith(apiRoutes.authLogout, {});
	});
});
