import axios from "axios";

const localApiBaseUrl = "http://localhost:4000";
const productionApiBaseUrl = "https://food-recipes-server-omega.vercel.app";
const apiBaseUrl =
	process.env.NODE_ENV === "production"
		? productionApiBaseUrl
		: localApiBaseUrl

export default axios.create({
	baseURL: apiBaseUrl,
});
