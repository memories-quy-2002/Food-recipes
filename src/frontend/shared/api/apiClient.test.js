import { afterEach, describe, expect, it, vi } from "vitest";
import {
	getApiConfig,
	getStoredAuthToken,
} from "./config";
import { createApiClient } from "./axios";
import { apiRoutes } from "./routes";

const originalWindow = globalThis.window;
const originalLocalStorage = globalThis.localStorage;
const originalSessionStorage = globalThis.sessionStorage;

const createStorage = (values) => ({
	getItem: (key) => values[key] ?? null,
});

afterEach(() => {
	if (originalWindow === undefined) delete globalThis.window;
	else globalThis.window = originalWindow;

	if (originalLocalStorage === undefined) delete globalThis.localStorage;
	else globalThis.localStorage = originalLocalStorage;

	if (originalSessionStorage === undefined) delete globalThis.sessionStorage;
	else globalThis.sessionStorage = originalSessionStorage;
});

describe("API target configuration", () => {
	it("defaults to the local Nest API through Kong in development", () => {
		expect(
			getApiConfig({ DEV: true, PROD: false }).baseURL
		).toBe("http://localhost:8000/api/v1");
	});

	it("uses the configured Kong host and Nest version prefix", () => {
		expect(
			getApiConfig({
				DEV: false,
				PROD: true,
				VITE_KONG_BASE_URL: "https://kong.example.test/",
			})
		).toEqual({
			target: "nest",
			baseURL: "https://kong.example.test/api/v1",
		});
	});

	it("does not fall back to the removed legacy API base URL", () => {
		expect(() =>
			getApiConfig({
				DEV: false,
				PROD: true,
				VITE_API_BASE_URL: "https://legacy.example.test",
			})
		).toThrow(/VITE_KONG_BASE_URL/);
	});
});

describe("Nest API authentication and expiry", () => {
	it("forwards the persisted local or session JWT as a Bearer token", () => {
		globalThis.localStorage = createStorage({
			isAuthenticated: "false",
			jwt: "stale-token",
		});
		globalThis.sessionStorage = createStorage({
			isAuthenticated: "true",
			jwt: "session-token",
		});

		const client = createApiClient({
			DEV: false,
			PROD: true,
			VITE_KONG_BASE_URL: "https://kong.example.test",
		});
		const requestHandler = client.interceptors.request.handlers[0].fulfilled;

		expect(requestHandler({ headers: {} }).headers.Authorization).toBe(
			"Bearer session-token"
		);
		expect(getStoredAuthToken()).toBe("session-token");
	});

	it("uses the Nest bearer-token interceptor by default", () => {
		globalThis.localStorage = createStorage({
			isAuthenticated: "true",
			jwt: "nest-token",
		});

		const client = createApiClient({ DEV: true, PROD: false });
		const requestHandler = client.interceptors.request.handlers[0].fulfilled;
		const request = requestHandler({ headers: {} });

		expect(request.headers.Authorization).toBe("Bearer nest-token");
	});

	it("publishes auth:expired and preserves the rejected 401", async () => {
		const dispatchEvent = vi.fn();
		globalThis.window = { dispatchEvent };
		const client = createApiClient({
			DEV: false,
			PROD: true,
			VITE_KONG_BASE_URL: "https://kong.example.test",
		});
		const responseErrorHandler =
			client.interceptors.response.handlers[0].rejected;
		const error = { response: { status: 401 } };

		await expect(responseErrorHandler(error)).rejects.toBe(error);
		expect(dispatchEvent).toHaveBeenCalledWith(
			expect.objectContaining({ type: "auth:expired" })
		);
	});
});

describe("API route compatibility", () => {
	it("exposes every frontend route on the Nest v1 contract", () => {
		expect(apiRoutes.recipes).toBe("/recipes");
		expect(apiRoutes.recipe(7)).toBe("/recipes/7");
		expect(apiRoutes.userRecipes).toBe("/users/me/recipes");
		expect(apiRoutes.categories).toBe("/categories");
		expect(apiRoutes.meals).toBe("/meals");
		expect(apiRoutes.userWishlist).toBe("/users/me/wishlist");
		expect(apiRoutes.userWishlistItem(7)).toBe("/users/me/wishlist/7");
		expect(apiRoutes.userRecipeRating(7)).toBe("/recipes/7/rating");
		expect(apiRoutes.userRecipeRatingDelete(7)).toBe("/recipes/7/rating");
		expect(apiRoutes.databaseHealth).toBe("/health/ready");
	});

	it("keeps route paths relative so the client base URL supplies /api/v1", () => {
		for (const route of [apiRoutes.recipes, apiRoutes.categories, apiRoutes.meals]) {
			expect(route).not.toMatch(/^\/api\/v1/);
		}
	});
});
