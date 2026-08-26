let accessToken: string | null = null;

export const getAccessToken = (): string | null => accessToken;

export const setAccessToken = (token: unknown): void => {
	accessToken = typeof token === "string" && token ? token : null;
};

export const clearAccessToken = (): void => {
	accessToken = null;
};
