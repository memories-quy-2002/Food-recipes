const localKongBaseUrl = "http://localhost:8000";

const trimTrailingSlashes = (value) => value.replace(/\/+$/, "");

export const getApiConfig = (env = import.meta.env) => {
	const kongBaseUrl = env.VITE_KONG_BASE_URL || (env.DEV ? localKongBaseUrl : "");

	if (!kongBaseUrl) {
		throw new Error(
			"Nest API requires VITE_KONG_BASE_URL to point to the Kong gateway."
		);
	}

	return {
		target: "nest",
		baseURL: `${trimTrailingSlashes(kongBaseUrl)}/api/v1`,
	};
};

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
