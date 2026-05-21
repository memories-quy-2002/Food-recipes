import axios from "axios";

const localApiBaseUrl = "http://localhost:4000";
const productionApiBaseUrl = "https://food-recipes-server-omega.vercel.app";
const apiBaseUrl = import.meta.env.PROD
	? productionApiBaseUrl
	: localApiBaseUrl;

export default axios.create({
	baseURL: apiBaseUrl,
});
