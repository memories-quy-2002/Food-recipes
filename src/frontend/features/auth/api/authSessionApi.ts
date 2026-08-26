import type { AxiosResponse } from "axios";
import axios from "@/shared/api/axios";
import {
	clearAccessToken,
	setAccessToken,
} from "@/features/auth/state/authTokenStore";
import { apiRoutes } from "@/shared/api/routes";

export const AUTH_REFRESH_TIMEOUT_MS = 5000;

export type AuthUser = {
	user_id: number;
	full_name?: string | null;
	email?: string | null;
};

export type AuthSession = {
	user: AuthUser | null;
	token?: string | null;
};

export type AuthSessionWithToken = AuthSession & {
	user: AuthUser;
	token: string;
};

type RecordValue = Record<string, unknown>;

const isRecord = (value: unknown): value is RecordValue =>
	typeof value === "object" && value !== null;

const isOptionalString = (value: unknown): value is string | null | undefined =>
	value === undefined || value === null || typeof value === "string";

export const isAuthUser = (value: unknown): value is AuthUser => {
	if (!isRecord(value) || typeof value.user_id !== "number") return false;
	return (
		Number.isSafeInteger(value.user_id) &&
		value.user_id > 0 &&
		isOptionalString(value.full_name) &&
		isOptionalString(value.email)
	);
};

export const isAuthSession = (
	value: unknown,
): value is AuthSessionWithToken => {
	if (!isRecord(value) || typeof value.token !== "string" || !value.token) {
		return false;
	}
	return isAuthUser(value.user);
};

type AuthRefreshError = Error & {
	code: "AUTH_REFRESH_INVALID";
};

class AuthRefreshInvalidError extends Error {
	readonly code = "AUTH_REFRESH_INVALID" as const;

	constructor() {
		super("The refresh response was invalid");
		this.name = "AuthRefreshInvalidError";
	}
}

const invalidRefreshError = (): AuthRefreshError =>
	new AuthRefreshInvalidError();

export const authSessionApi = {
	async refresh(): Promise<AuthSessionWithToken> {
		const response: AxiosResponse<unknown> = await axios.post<unknown>(
			apiRoutes.authRefresh,
			{},
			{ timeout: AUTH_REFRESH_TIMEOUT_MS },
		);
		if (!isAuthSession(response.data)) {
			clearAccessToken();
			throw invalidRefreshError();
		}
		setAccessToken(response.data.token);
		return {
			user: response.data.user,
			token: response.data.token,
		};
	},

	logout(): Promise<AxiosResponse<unknown>> {
		return axios.post<unknown>(apiRoutes.authLogout, {});
	},
};

export default authSessionApi;
