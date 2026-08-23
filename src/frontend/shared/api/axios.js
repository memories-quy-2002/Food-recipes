import axios from "axios";

import { getApiConfig, getStoredAuthToken } from "./config";

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
	});

	client.interceptors.request.use((config) => {
		const token = getStoredAuthToken();
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
		(error) => {
			if (error.response?.status === 401) {
				dispatchAuthExpired();
			}

			return Promise.reject(error);
		}
	);

	return client;
};

const api = createApiClient();

export default api;
