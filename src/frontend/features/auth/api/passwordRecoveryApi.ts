import axios from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";
import type { MessageResponse } from "@/shared/api/contracts";

type RecordValue = Record<string, unknown>;

const isRecord = (value: unknown): value is RecordValue =>
	typeof value === "object" && value !== null;

export const isMessageResponse = (
	value: unknown,
): value is MessageResponse =>
	isRecord(value) &&
	typeof value.message === "string" &&
	value.message.trim().length > 0;

const postMessage = async (
	route: string,
	body: Record<string, string>,
): Promise<MessageResponse> => {
	const response = await axios.post<unknown>(route, body);
	if (!isMessageResponse(response.data)) {
		throw new Error("The authentication response was invalid.");
	}
	return response.data;
};

export const requestPasswordReset = (
	email: string,
): Promise<MessageResponse> =>
	postMessage(apiRoutes.authForgotPassword, { email });

export const resetPassword = (
	token: string,
	newPassword: string,
): Promise<MessageResponse> =>
	postMessage(apiRoutes.authResetPassword, { token, newPassword });

export const verifyEmail = (token: string): Promise<MessageResponse> =>
	postMessage(apiRoutes.authVerifyEmail, { token });

export const resendVerification = (): Promise<MessageResponse> =>
	postMessage(apiRoutes.authResendVerification, {});

export const getSafeAuthErrorMessage = (
	error: unknown,
	fallback: string,
): string => {
	const response =
		isRecord(error) && isRecord(error.response) ? error.response : null;
	const responseData = response?.data;
	const code =
		isRecord(responseData) && typeof responseData.code === "string"
			? responseData.code
			: null;

	if (code === "RECOVERY_TOKEN_INVALID") {
		return "This recovery link is invalid or has expired. Request a new link to continue.";
	}

	if (response?.status === 429) {
		return "Too many attempts. Please wait a moment and try again.";
	}

	return fallback;
};
