import { afterEach, describe, expect, it, vi } from "vitest";
import {
	apiTargets,
	getApiConfig,
	getStoredAuthToken,
	normalizeApiTarget,
} from "./config";
import { createApiClient } from "./axios";
import {
	ApiCompatibilityError,
	apiRouteCompatibility,
	createApiRoutes,
} from "./routes";

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
	it("keeps legacy mode as the safe default", () => {
		expect(normalizeApiTarget()).toBe(apiTargets.LEGACY);
		expect(
			getApiConfig({ DEV: true, PROD: false }).baseURL
		).toBe("http://localhost:4000");
	});

	it("uses the configured Kong host and Nest version prefix", () => {
		expect(
			getApiConfig({
				DEV: false,
				PROD: true,
				VITE_API_TARGET: "kong",
				VITE_KONG_BASE_URL: "https://kong.example.test/",
			})
		).toEqual({
			target: apiTargets.NEST,
			baseURL: "https://kong.example.test/api/v1",
		});
	});

	it("does not send a legacy API base URL to Nest mode", () => {
		expect(() =>
			getApiConfig({
				DEV: false,
				PROD: true,
				VITE_API_TARGET: "nest",
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
			VITE_API_TARGET: "nest",
			VITE_KONG_BASE_URL: "https://kong.example.test",
		});
		const requestHandler = client.interceptors.request.handlers[0].fulfilled;

		expect(requestHandler({ headers: {} }).headers.Authorization).toBe(
			"Bearer session-token"
		);
		expect(getStoredAuthToken()).toBe("session-token");
	});

	it("does not add a bearer token to legacy requests", () => {
		globalThis.localStorage = createStorage({
			isAuthenticated: "true",
			jwt: "legacy-token",
		});

		const client = createApiClient({ DEV: true, PROD: false });
		const requestHandler = client.interceptors.request.handlers[0].fulfilled;
		const request = requestHandler({ headers: {} });

		expect(request.headers.Authorization).toBeUndefined();
	});

	it("publishes auth:expired and preserves the rejected 401", async () => {
		const dispatchEvent = vi.fn();
		globalThis.window = { dispatchEvent };
		const client = createApiClient({ DEV: true, PROD: false });
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
	it("maps authenticated Nest routes to server-owned user identity", () => {
		const routes = createApiRoutes(apiTargets.NEST);

		expect(routes.recipes).toBe("/recipes");
		expect(routes.userRecipes(42)).toBe("/users/me/recipes");
		expect(routes.userWishlist(42)).toBe("/users/me/wishlist");
		expect(routes.userWishlistItem(42, 7)).toBe(
			"/users/me/wishlist/7"
		);
		expect(routes.userRecipeRating(7)).toBe("/recipes/7/rating");
		expect(routes.databaseHealth).toBe("/health/ready");
	});

	it("marks rating mutations ownership-safe only for Nest", () => {
		expect(apiRouteCompatibility.userRecipeRating.ownershipSafe).toEqual({
			legacy: false,
			nest: true,
		});
		expect(apiRouteCompatibility.userRecipeRatingDelete.ownershipSafe).toEqual({
			legacy: false,
			nest: true,
		});
	});

	it("keeps unsupported Nest routes explicit instead of guessing a path", () => {
		const routes = createApiRoutes(apiTargets.NEST);

		expect(apiRouteCompatibility.categories).toMatchObject({
			legacy: true,
			nest: false,
		});
		expect(() => routes.categories).toThrow(ApiCompatibilityError);
		expect(() => routes.meals).toThrow(/meals controller/);
		expect(createApiRoutes(apiTargets.LEGACY).categories).toBe("/categories");
	});
});
