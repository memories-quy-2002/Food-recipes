import axios from "axios";

const localApiBaseUrl = "http://localhost:4000";
const productionApiBaseUrl = "https://food-recipes-server-omega.vercel.app";
const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const isLocalConfiguredApi =
	configuredApiBaseUrl?.includes("localhost") ||
	configuredApiBaseUrl?.includes("127.0.0.1");
const apiBaseUrl =
	import.meta.env.PROD && isLocalConfiguredApi
		? productionApiBaseUrl
		: configuredApiBaseUrl ||
		  (import.meta.env.DEV ? localApiBaseUrl : productionApiBaseUrl);

export default axios.create({
	baseURL: apiBaseUrl,
});
