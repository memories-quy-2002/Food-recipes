import axios, {
	AxiosHeaders,
	type AxiosInstance,
	type AxiosResponse,
	type InternalAxiosRequestConfig,
} from "axios";

import {
	getApiConfig,
	getAuthToken,
	setAuthToken,
	type ApiEnvironment,
} from "./config";
import { apiRoutes } from "./routes";

type RetriableRequestConfig = InternalAxiosRequestConfig & {
	__retried?: boolean;
};

type RefreshResponse = {
	token?: string;
};

export const dispatchAuthExpired = (): void => {
	if (typeof window === "undefined") return;
	const event =
		typeof CustomEvent === "function"
			? new CustomEvent("auth:expired")
			: new Event("auth:expired");
	window.dispatchEvent(event);
};

export const createApiClient = (
	env: ApiEnvironment = import.meta.env,
): AxiosInstance => {
	const apiConfig = getApiConfig(env);
	const client = axios.create({
		baseURL: apiConfig.baseURL,
		withCredentials: true,
	});

	let refreshPromise: Promise<AxiosResponse<RefreshResponse>> | null = null;

	client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
		const token = getAuthToken();
		if (!token) return config;
		config.headers = config.headers || new AxiosHeaders();
		if (typeof config.headers.set === "function") {
			config.headers.set("Authorization", `Bearer ${token}`);
		} else {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	});

	client.interceptors.response.use(
		(response) => response,
		async (error: unknown) => {
			if (!axios.isAxiosError(error)) return Promise.reject(error);

			const originalRequest = error.config as
				| RetriableRequestConfig
				| undefined;
			const isUnauthorized = error.response?.status === 401;
			const isRefreshRequest = originalRequest?.url === apiRoutes.authRefresh;
			const isLogoutRequest = originalRequest?.url === apiRoutes.authLogout;

			if (
				!isUnauthorized ||
				!originalRequest ||
				originalRequest.__retried ||
				isRefreshRequest ||
				isLogoutRequest
			) {
				if (isUnauthorized && !isLogoutRequest) dispatchAuthExpired();
				return Promise.reject(error);
			}

			try {
				refreshPromise ??= client
					.post<RefreshResponse>(apiRoutes.authRefresh, {})
					.finally(() => {
						refreshPromise = null;
					});
				const response = await refreshPromise;
				const token = response.data?.token;
				if (!token) throw error;
				setAuthToken(token);
				originalRequest.__retried = true;
				originalRequest.headers = originalRequest.headers || new AxiosHeaders();
				originalRequest.headers.Authorization = `Bearer ${token}`;
				return client(originalRequest);
			} catch {
				dispatchAuthExpired();
				return Promise.reject(error);
			}
		},
	);

	return client;
};

const api = createApiClient();
export default api;
