import type { AxiosResponse } from "axios";

export type AuthRefreshResponse = {
	token?: string | null;
	user?: unknown;
};

type RefreshRequest = () => Promise<AxiosResponse<AuthRefreshResponse>>;

let refreshPromise: Promise<AxiosResponse<AuthRefreshResponse>> | null = null;

export const withSharedAuthRefresh = (
	request: RefreshRequest,
): Promise<AxiosResponse<AuthRefreshResponse>> => {
	refreshPromise ??= request().finally(() => {
		refreshPromise = null;
	});
	return refreshPromise;
};
