import { afterEach, describe, expect, it, vi } from "vitest";
import {
	clearAccessToken,
	getAccessToken,
	setAccessToken,
} from "@/features/auth/state/authTokenStore";
import { getApiConfig, getAuthToken, setAuthToken } from "./config";
import { createApiClient } from "./axios";
import { apiRoutes } from "./routes";

const originalWindow = globalThis.window;
const originalLocalStorage = globalThis.localStorage;
const originalSessionStorage = globalThis.sessionStorage;

const createStorage = (values) => ({
	getItem: (key) => values[key] ?? null,
	setItem: vi.fn((key, value) => { values[key] = String(value); }),
});

afterEach(() => {
	if (originalWindow === undefined) delete globalThis.window;
	else globalThis.window = originalWindow;
	if (originalLocalStorage === undefined) delete globalThis.localStorage;
	else globalThis.localStorage = originalLocalStorage;
	if (originalSessionStorage === undefined) delete globalThis.sessionStorage;
	else globalThis.sessionStorage = originalSessionStorage;
	clearAccessToken();
	vi.restoreAllMocks();
});

describe("API target configuration", () => {
	it("defaults to the direct Nest API on port 3000 in development", () => {
		expect(getApiConfig({ DEV: true, PROD: false }).baseURL).toBe("http://localhost:3000/api/v1");
	});

	it("uses the configured Kong host and Nest version prefix", () => {
		expect(getApiConfig({ DEV: false, PROD: true, VITE_KONG_BASE_URL: "https://kong.example.test/" })).toEqual({
			target: "nest",
			baseURL: "https://kong.example.test/api/v1",
		});
	});

	it("does not fall back to the removed legacy API base URL", () => {
		expect(() => getApiConfig({ DEV: false, PROD: true, VITE_API_BASE_URL: "https://legacy.example.test" })).toThrow(/VITE_KONG_BASE_URL/);
	});
});

describe("Nest API authentication and expiry", () => {
	it("exposes memory-token adapters without storage semantics", () => {
		setAuthToken("adapter-token");

		expect(getAuthToken()).toBe("adapter-token");
	});

	it("forwards the memory access token and ignores stored JWT values", () => {
		globalThis.localStorage = createStorage({ isAuthenticated: "false", jwt: "stale-token" });
		globalThis.sessionStorage = createStorage({ isAuthenticated: "true", jwt: "session-token" });
		setAccessToken("memory-token");
		const client = createApiClient({ DEV: false, PROD: true, VITE_KONG_BASE_URL: "https://kong.example.test" });
		const requestHandler = client.interceptors.request.handlers[0].fulfilled;
		expect(requestHandler({ headers: {} }).headers.Authorization).toBe("Bearer memory-token");

		setAccessToken(null);
		expect(requestHandler({ headers: {} }).headers.Authorization).toBeUndefined();
	});

	it("enables credentials so the HttpOnly refresh cookie is sent", () => {
		const client = createApiClient({ DEV: true, PROD: false });
		expect(client.defaults.withCredentials).toBe(true);
	});

	it("refreshes once after a 401, stores the new token in memory, and retries the request", async () => {
		setAccessToken("expired-token");
		const localStorage = createStorage({ isAuthenticated: "true", jwt: "expired-token" });
		globalThis.localStorage = localStorage;
		globalThis.sessionStorage = createStorage({});
		const client = createApiClient({ DEV: false, PROD: true, VITE_KONG_BASE_URL: "https://kong.example.test" });
		vi.spyOn(client, "post").mockResolvedValue({ data: { token: "fresh-token" } });
		const requestSpy = vi.fn().mockResolvedValue({ data: { ok: true } });
		client.defaults.adapter = async (config) => requestSpy(config);
		const responseErrorHandler = client.interceptors.response.handlers[0].rejected;
		const original = { url: "/recipes", method: "get", headers: {}, __retried: false };
		await responseErrorHandler({ response: { status: 401 }, config: original });
		expect(client.post).toHaveBeenCalledWith(apiRoutes.authRefresh, {});
		expect(getAccessToken()).toBe("fresh-token");
		expect(localStorage.setItem).not.toHaveBeenCalled();
		expect(original.__retried).toBe(true);
	});

	it("publishes auth:expired when refresh fails", async () => {
		const dispatchEvent = vi.fn();
		globalThis.window = { dispatchEvent };
		const client = createApiClient({ DEV: false, PROD: true, VITE_KONG_BASE_URL: "https://kong.example.test" });
		vi.spyOn(client, "post").mockRejectedValue(new Error("refresh failed"));
		const responseErrorHandler = client.interceptors.response.handlers[0].rejected;
		const error = { response: { status: 401 }, config: { url: "/recipes", headers: {} } };
		await expect(responseErrorHandler(error)).rejects.toBe(error);
		expect(dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: "auth:expired" }));
	});
});

describe("API route compatibility", () => {
	it("exposes every frontend route on the Nest v1 contract", () => {
		expect(apiRoutes.recipes).toBe("/recipes");
		expect(apiRoutes.recipe(7)).toBe("/recipes/7");
		expect(apiRoutes.userRecipes).toBe("/users/me/recipes");
		expect(apiRoutes.userRecipeDrafts).toBe("/users/me/recipes/drafts");
		expect(apiRoutes.recipeIngredients(7)).toBe("/recipes/7/ingredients");
		expect(apiRoutes.recipeNutrition(7)).toBe("/recipes/7/nutrition");
		expect(apiRoutes.recipeDietaryTags(7)).toBe("/recipes/7/dietary-tags");
		expect(apiRoutes.recipePublish(7)).toBe("/recipes/7/publish");
		expect(apiRoutes.recipeArchive(7)).toBe("/recipes/7/archive");
		expect(apiRoutes.recipeRestore(7)).toBe("/recipes/7/restore");
		expect(apiRoutes.categories).toBe("/categories");
		expect(apiRoutes.meals).toBe("/meals");
		expect(apiRoutes.userWishlist).toBe("/users/me/wishlist");
		expect(apiRoutes.userWishlistItem(7)).toBe("/users/me/wishlist/7");
		expect(apiRoutes.userRecipeRating(7)).toBe("/recipes/7/rating");
		expect(apiRoutes.authRefresh).toBe("/auth/refresh");
		expect(apiRoutes.databaseHealth).toBe("/health/ready");
	});
});
