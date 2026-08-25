import {
	getAccessToken,
	setAccessToken,
} from "../../features/auth/state/authTokenStore";

const localKongBaseUrl = "http://localhost:3000";

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

export const getAuthToken = () => getAccessToken();

export const setAuthToken = (token) => setAccessToken(token);
