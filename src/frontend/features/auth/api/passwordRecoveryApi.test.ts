import axios from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	getSafeAuthErrorMessage,
	isMessageResponse,
	requestPasswordReset,
	resendVerification,
	resetPassword,
	verifyEmail,
} from "./passwordRecoveryApi";

vi.mock("@/shared/api/axios", () => ({
	default: { post: vi.fn() },
}));

const postMock = vi.mocked(axios.post);

afterEach(() => {
	postMock.mockReset();
});

describe("password recovery API", () => {
	it("requests recovery instructions with the email address", async () => {
		postMock.mockResolvedValue({
			data: { message: "If the account exists, recovery instructions will be sent." },
		} as never);

		await expect(requestPasswordReset("cook@example.test")).resolves.toEqual({
			message: "If the account exists, recovery instructions will be sent.",
		});
		expect(postMock).toHaveBeenCalledWith(apiRoutes.authForgotPassword, {
			email: "cook@example.test",
		});
	});

	it("consumes a password reset token with the new password", async () => {
		postMock.mockResolvedValue({ data: { message: "Password reset successfully." } } as never);

		await resetPassword("opaque-reset-token", "correct horse battery staple");

		expect(postMock).toHaveBeenCalledWith(apiRoutes.authResetPassword, {
			token: "opaque-reset-token",
			newPassword: "correct horse battery staple",
		});
	});

	it("verifies an email with the token from the delivery link", async () => {
		postMock.mockResolvedValue({ data: { message: "Email verified successfully." } } as never);

		await verifyEmail("opaque-verification-token");

		expect(postMock).toHaveBeenCalledWith(apiRoutes.authVerifyEmail, {
			token: "opaque-verification-token",
		});
	});

	it("resends verification instructions through the authenticated route", async () => {
		postMock.mockResolvedValue({
			data: { message: "If the account is eligible, verification instructions will be sent." },
		} as never);

		await resendVerification();

		expect(postMock).toHaveBeenCalledWith(apiRoutes.authResendVerification, {});
	});

	it("rejects malformed message responses", async () => {
		postMock.mockResolvedValue({ data: { message: "" } } as never);

		await expect(requestPasswordReset("cook@example.test")).rejects.toThrow(
			"The authentication response was invalid.",
		);
		expect(isMessageResponse({ message: "ok" })).toBe(true);
		expect(isMessageResponse({ message: 42 })).toBe(false);
	});

	it("maps only safe recovery and throttle errors to user-facing copy", () => {
		const recoveryError = {
			response: { status: 401, data: { code: "RECOVERY_TOKEN_INVALID" } },
		};
		const throttleError = { response: { status: 429, data: {} } };

		expect(
			getSafeAuthErrorMessage(recoveryError, "fallback"),
		).toMatch(/invalid or has expired/i);
		expect(getSafeAuthErrorMessage(throttleError, "fallback")).toMatch(
			/too many attempts/i,
		);
		expect(getSafeAuthErrorMessage(new Error("offline"), "fallback")).toBe(
			"fallback",
		);
	});
});
