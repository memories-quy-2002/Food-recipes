import { afterEach, describe, expect, it, vi } from "vitest";
import {
	AxiosError,
	AxiosHeaders,
	type AxiosResponse,
	type InternalAxiosRequestConfig,
} from "axios";
import {
	clearAccessToken,
	getAccessToken,
	setAccessToken,
} from "@/features/auth/state/authTokenStore";
import { getApiConfig, getAuthToken, setAuthToken } from "./config";
import { createApiClient } from "./axios";
import { apiRoutes } from "./routes";

type StorageMock = {
	getItem: (key: string) => string | null;
	setItem: ReturnType<typeof vi.fn>;
};

type RequestFixture = InternalAxiosRequestConfig & {
	__retried?: boolean;
};

const originalWindow = globalThis.window;
const originalLocalStorage = globalThis.localStorage;
const originalSessionStorage = globalThis.sessionStorage;

const createStorage = (values: Record<string, string>): StorageMock => ({
	getItem: (key) => values[key] ?? null,
	setItem: vi.fn((key: string, value: string) => {
		values[key] = String(value);
	}),
});

const installGlobal = (
	name: "window" | "localStorage" | "sessionStorage",
	value: unknown,
): void => {
	Object.defineProperty(globalThis, name, {
		configurable: true,
		value,
	});
};

const createRequestConfig = (url = ""): RequestFixture => ({
	url,
	method: "get",
	headers: new AxiosHeaders(),
});

const createResponse = <T>(
	data: T,
	config = createRequestConfig(),
): AxiosResponse<T> => ({
	data,
	status: 200,
	statusText: "OK",
	headers: new AxiosHeaders(),
	config,
});

const createUnauthorizedError = (config: RequestFixture): AxiosError<unknown> => {
	const error = new AxiosError("Request failed", "ERR_BAD_REQUEST", config);
	error.response = {
		data: {},
		status: 401,
		statusText: "Unauthorized",
		headers: new AxiosHeaders(),
		config,
	};
	return error;
};

const getRequestHandler = (
	client: ReturnType<typeof createApiClient>,
): ((config: RequestFixture) => Promise<InternalAxiosRequestConfig>) => {
	const handler = client.interceptors.request.handlers?.[0]?.fulfilled;
	if (!handler) throw new Error("The request interceptor was not registered.");
	return async (config) => handler(config);
};

const getResponseErrorHandler = (
	client: ReturnType<typeof createApiClient>,
): ((error: unknown) => Promise<unknown>) => {
	const handler = client.interceptors.response.handlers?.[0]?.rejected;
	if (!handler) throw new Error("The response interceptor was not registered.");
	return async (error) => handler(error);
};

afterEach(() => {
	if (originalWindow === undefined) delete (globalThis as { window?: Window }).window;
	else installGlobal("window", originalWindow);
	if (originalLocalStorage === undefined) delete (globalThis as { localStorage?: Storage }).localStorage;
	else installGlobal("localStorage", originalLocalStorage);
	if (originalSessionStorage === undefined) delete (globalThis as { sessionStorage?: Storage }).sessionStorage;
	else installGlobal("sessionStorage", originalSessionStorage);
	clearAccessToken();
	vi.restoreAllMocks();
});

describe("API target configuration", () => {
	it("defaults to the direct Nest API on port 3000 in development", () => {
		expect(getApiConfig({ DEV: true, PROD: false }).baseURL).toBe(
			"http://localhost:3000/api/v1",
		);
	});

	it("uses the configured API host and Nest version prefix", () => {
		expect(
			getApiConfig({
				DEV: false,
				PROD: true,
				VITE_API_BASE_URL: "https://api.example.test/",
			}),
		).toEqual({
			target: "nest",
			baseURL: "https://api.example.test/api/v1",
		});
	});

	it("requires an API base URL in production", () => {
		expect(() => getApiConfig({ DEV: false, PROD: true })).toThrow(
			/VITE_API_BASE_URL/,
		);
	});
});

describe("Nest API authentication and expiry", () => {
	it("exposes memory-token adapters without storage semantics", () => {
		setAuthToken("adapter-token");

		expect(getAuthToken()).toBe("adapter-token");
	});

	it("forwards the memory access token and ignores stored JWT values", async () => {
		installGlobal(
			"localStorage",
			createStorage({ isAuthenticated: "false", jwt: "stale-token" }),
		);
		installGlobal(
			"sessionStorage",
			createStorage({ isAuthenticated: "true", jwt: "session-token" }),
		);
		setAccessToken("memory-token");
		const client = createApiClient({
			DEV: false,
			PROD: true,
			VITE_API_BASE_URL: "https://api.example.test",
		});
		const requestHandler = getRequestHandler(client);
		expect((await requestHandler(createRequestConfig())).headers.Authorization).toBe(
			"Bearer memory-token",
		);

		setAccessToken(null);
		expect(
			(await requestHandler(createRequestConfig())).headers.Authorization,
		).toBeUndefined();
	});

	it("enables credentials so the HttpOnly refresh cookie is sent", () => {
		const client = createApiClient({ DEV: true, PROD: false });
		expect(client.defaults.withCredentials).toBe(true);
	});

	it("refreshes once after a 401, stores the new token in memory, and retries the request", async () => {
		setAccessToken("expired-token");
		const localStorage = createStorage({
			isAuthenticated: "true",
			jwt: "expired-token",
		});
		installGlobal("localStorage", localStorage);
		installGlobal("sessionStorage", createStorage({}));
		const client = createApiClient({
			DEV: false,
			PROD: true,
			VITE_API_BASE_URL: "https://api.example.test",
		});
		vi.spyOn(client, "post").mockResolvedValue(
			createResponse({ token: "fresh-token" }),
		);
		const requestSpy = vi.fn();
		client.defaults.adapter = async (config) => {
			requestSpy(config);
			return createResponse({ ok: true }, config);
		};
		const responseErrorHandler = getResponseErrorHandler(client);
		const original = createRequestConfig("/recipes");
		await responseErrorHandler(createUnauthorizedError(original));
		expect(client.post).toHaveBeenCalledWith(apiRoutes.authRefresh, {});
		expect(getAccessToken()).toBe("fresh-token");
		expect(localStorage.setItem).not.toHaveBeenCalled();
		expect(original.__retried).toBe(true);
	});

	it("shares one refresh request across concurrent unauthorized requests", async () => {
		setAccessToken("expired-token");
		const client = createApiClient({
			DEV: false,
			PROD: true,
			VITE_API_BASE_URL: "https://api.example.test",
		});
		const refresh = vi.spyOn(client, "post").mockResolvedValue(
			createResponse({ token: "fresh-token" }),
		);
		client.defaults.adapter = async (config) =>
			createResponse({ ok: true }, config);
		const responseErrorHandler = getResponseErrorHandler(client);
		const first = createRequestConfig("/first");
		const second = createRequestConfig("/second");

		await Promise.all([
			responseErrorHandler(createUnauthorizedError(first)),
			responseErrorHandler(createUnauthorizedError(second)),
		]);

		expect(refresh).toHaveBeenCalledTimes(1);
		expect(first.__retried).toBe(true);
		expect(second.__retried).toBe(true);
		expect(getAccessToken()).toBe("fresh-token");
	});

	it("publishes auth:expired when refresh fails", async () => {
		const dispatchEvent = vi.fn();
		installGlobal("localStorage", createStorage({}));
		Object.defineProperty(globalThis, "window", {
			configurable: true,
			value: { dispatchEvent },
		});
		const client = createApiClient({
			DEV: false,
			PROD: true,
			VITE_API_BASE_URL: "https://api.example.test",
		});
		vi.spyOn(client, "post").mockRejectedValue(new Error("refresh failed"));
		const responseErrorHandler = getResponseErrorHandler(client);
		const error = createUnauthorizedError(createRequestConfig("/recipes"));
		await expect(responseErrorHandler(error)).rejects.toBe(error);
		expect(dispatchEvent).toHaveBeenCalledWith(
			expect.objectContaining({ type: "auth:expired" }),
		);
	});

	it("does not publish auth expiry for an anonymous refresh bootstrap failure", async () => {
		const dispatchEvent = vi.fn();
		Object.defineProperty(globalThis, "window", {
			configurable: true,
			value: { dispatchEvent },
		});
		const client = createApiClient({
			DEV: false,
			PROD: true,
			VITE_API_BASE_URL: "https://api.example.test",
		});
		const responseErrorHandler = getResponseErrorHandler(client);
		const error = createUnauthorizedError(createRequestConfig(apiRoutes.authRefresh));

		await expect(responseErrorHandler(error)).rejects.toBe(error);
		expect(dispatchEvent).not.toHaveBeenCalled();
	});

	it("does not refresh or emit expiry while logout is being finalized", async () => {
		const dispatchEvent = vi.fn();
		Object.defineProperty(globalThis, "window", {
			configurable: true,
			value: { dispatchEvent },
		});
		const client = createApiClient({
			DEV: false,
			PROD: true,
			VITE_API_BASE_URL: "https://api.example.test",
		});
		const responseErrorHandler = getResponseErrorHandler(client);
		const error = createUnauthorizedError(
			createRequestConfig(apiRoutes.authLogout),
		);

		await expect(responseErrorHandler(error)).rejects.toBe(error);
		expect(dispatchEvent).not.toHaveBeenCalled();
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
