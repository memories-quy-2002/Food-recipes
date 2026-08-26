import {
	getAccessToken,
	setAccessToken,
} from "../../features/auth/state/authTokenStore";

const localApiBaseUrl = "http://localhost:3000";

export type ApiEnvironment = {
	DEV?: boolean;
	PROD?: boolean;
	VITE_API_BASE_URL?: string;
};

export type ApiConfig = {
	target: "nest";
	baseURL: string;
};

const trimTrailingSlashes = (value: string): string => value.replace(/\/+$/, "");

export const getApiConfig = (
	env: ApiEnvironment = import.meta.env,
): ApiConfig => {
	const apiBaseUrl = env.VITE_API_BASE_URL || (env.DEV ? localApiBaseUrl : "");

	if (!apiBaseUrl) {
		throw new Error("Nest API requires VITE_API_BASE_URL to point to the API.");
	}

	return {
		target: "nest",
		baseURL: `${trimTrailingSlashes(apiBaseUrl)}/api/v1`,
	};
};

export const getAuthToken = (): string | null => getAccessToken();

export const setAuthToken = (token: string | null | undefined): void =>
	setAccessToken(token);
