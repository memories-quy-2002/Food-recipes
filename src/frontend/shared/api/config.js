const localApiBaseUrl = "http://localhost:4000";
const productionApiBaseUrl = "https://food-recipes-server-omega.vercel.app";
const localKongBaseUrl = "http://localhost:8000";

export const apiTargets = Object.freeze({
	LEGACY: "legacy",
	NEST: "nest",
});

const trimTrailingSlashes = (value) => value.replace(/\/+$/, "");

export const normalizeApiTarget = (value) => {
	const normalizedValue = String(value || "").trim().toLowerCase();

	return ["nest", "nestjs", "kong"].includes(normalizedValue)
		? apiTargets.NEST
		: apiTargets.LEGACY;
};

export const getApiConfig = (env = import.meta.env) => {
	const target = normalizeApiTarget(env.VITE_API_TARGET);

	if (target === apiTargets.NEST) {
		const kongBaseUrl = env.VITE_KONG_BASE_URL || (env.DEV ? localKongBaseUrl : "");

		if (!kongBaseUrl) {
			throw new Error(
				"Nest API mode requires VITE_KONG_BASE_URL to point to the Kong gateway."
			);
		}

		return {
			target,
			baseURL: `${trimTrailingSlashes(kongBaseUrl)}/api/v1`,
		};
	}

	const configuredApiBaseUrl = env.VITE_API_BASE_URL;
	const isLocalConfiguredApi =
		configuredApiBaseUrl?.includes("localhost") ||
		configuredApiBaseUrl?.includes("127.0.0.1");

	return {
		target,
		baseURL:
			env.PROD && isLocalConfiguredApi
				? productionApiBaseUrl
				: configuredApiBaseUrl ||
				  (env.DEV ? localApiBaseUrl : productionApiBaseUrl),
	};
};

export const getApiTarget = (env = import.meta.env) =>
	getApiConfig(env).target;

const getStorageToken = (storage) => {
	try {
		return storage?.getItem("isAuthenticated") === "true"
			? storage.getItem("jwt")
			: null;
	} catch {
		return null;
	}
};

export const getStoredAuthToken = (storageLike = globalThis) => {
	const localToken = getStorageToken(storageLike.localStorage);

	return localToken || getStorageToken(storageLike.sessionStorage);
};
