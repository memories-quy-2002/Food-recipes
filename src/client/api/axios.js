import axios from "axios";

const localApiBaseUrl = "http://localhost:4000";
const productionApiBaseUrl = "https://food-recipes-server-omega.vercel.app";

export default axios.create({
	baseURL:
		import.meta.env.VITE_API_BASE_URL ||
		(import.meta.env.DEV ? localApiBaseUrl : productionApiBaseUrl),
});
