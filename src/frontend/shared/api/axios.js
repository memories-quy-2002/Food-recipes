import axios from "axios";

import { getApiConfig, getAuthToken, setAuthToken } from "./config";
import { apiRoutes } from "./routes";

export const dispatchAuthExpired = () => {
	if (typeof window === "undefined") return;
	const event =
		typeof CustomEvent === "function"
			? new CustomEvent("auth:expired")
			: { type: "auth:expired" };
	window.dispatchEvent(event);
};

export const createApiClient = (env = import.meta.env) => {
	const apiConfig = getApiConfig(env);
	const client = axios.create({
		baseURL: apiConfig.baseURL,
		withCredentials: true,
	});

	let refreshPromise = null;

	client.interceptors.request.use((config) => {
		const token = getAuthToken();
		if (!token) return config;
		config.headers = config.headers || {};
		if (typeof config.headers.set === "function") {
			config.headers.set("Authorization", `Bearer ${token}`);
		} else {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	});

	client.interceptors.response.use(
		(response) => response,
		async (error) => {
			const originalRequest = error.config;
			const isUnauthorized = error.response?.status === 401;
			const isRefreshRequest = originalRequest?.url === apiRoutes.authRefresh;

			if (!isUnauthorized || !originalRequest || originalRequest.__retried || isRefreshRequest) {
				if (isUnauthorized) dispatchAuthExpired();
				return Promise.reject(error);
			}

			try {
				refreshPromise ??= client.post(apiRoutes.authRefresh, {}).finally(() => {
					refreshPromise = null;
				});
				const response = await refreshPromise;
				const token = response.data?.token;
				if (!token) throw error;
				setAuthToken(token);
				originalRequest.__retried = true;
				originalRequest.headers = originalRequest.headers || {};
				originalRequest.headers.Authorization = `Bearer ${token}`;
				return client(originalRequest);
			} catch {
				dispatchAuthExpired();
				return Promise.reject(error);
			}
		}
	);

	return client;
};

const api = createApiClient();
export default api;
