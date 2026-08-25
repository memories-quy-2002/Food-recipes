import axios from "@/shared/api/axios";
import {
	clearAccessToken,
	setAccessToken,
} from "@/features/auth/state/authTokenStore";
import { apiRoutes } from "@/shared/api/routes";

export const AUTH_REFRESH_TIMEOUT_MS = 5000;

const invalidRefreshError = () => {
	const error = new Error("The refresh response was invalid");
	error.code = "AUTH_REFRESH_INVALID";
	return error;
};

export const authSessionApi = {
	async refresh() {
		const response = await axios.post(apiRoutes.authRefresh, {}, { timeout: AUTH_REFRESH_TIMEOUT_MS });
		const token = response.data?.token;
		const user = response.data?.user;
		if (!token || !user) {
			clearAccessToken();
			throw invalidRefreshError();
		}
		setAccessToken(token);
		return { user, token };
	},

	logout() {
		return axios.post(apiRoutes.authLogout, {});
	},
};

export default authSessionApi;
