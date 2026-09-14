import { useState, type ReactElement } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import type { RootState } from "@/app/store";
import {
	getSafeAuthErrorMessage,
	resendVerification,
} from "@/features/auth/api/passwordRecoveryApi";
import Button from "@/shared/ui/Button";

const EmailVerificationReminder = (): ReactElement | null => {
	const { local, session } = useSelector((state: RootState) => state.auth);
	const location = useLocation();
	const [isSending, setIsSending] = useState(false);
	const [dismissed, setDismissed] = useState(false);
	const [status, setStatus] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const isAuthenticated = local.isAuthenticated || session.isAuthenticated;
	const user = local.isAuthenticated ? local.user : session.user;
	const isTokenFlow =
		location.pathname === "/account/reset-password" ||
		location.pathname === "/account/verify-email";

	if (
		!isAuthenticated ||
		user?.email_verified !== false ||
		dismissed ||
		isTokenFlow
	) {
		return null;
	}

	const handleResend = async (): Promise<void> => {
		if (isSending) return;
		setIsSending(true);
		setStatus(null);
		setError(null);
		try {
			await resendVerification();
			setStatus(
				"If your account is eligible, verification instructions will be sent.",
			);
		} catch (requestError: unknown) {
			setError(
				getSafeAuthErrorMessage(
					requestError,
					"We could not resend verification instructions right now. Please try again.",
				),
			);
		} finally {
			setIsSending(false);
		}
	};

	return (
		<aside
			className="border-b border-primary/20 bg-primary/10 px-4 py-3 text-foreground sm:px-6 lg:px-8"
			aria-labelledby="email-verification-reminder-title"
		>
			<div className="mx-auto flex w-full max-w-[112rem] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="min-w-0">
					<h2
						id="email-verification-reminder-title"
						className="font-black"
					>
						Verify your email
					</h2>
					<p className="mt-1 text-sm leading-6 text-muted-foreground">
						Verify your email to keep your account secure and receive account
						messages.
					</p>
					{status && (
						<p className="mt-2 text-sm font-semibold text-foreground" role="status" aria-live="polite">
							{status}
						</p>
					)}
					{error && (
						<p className="mt-2 text-sm font-semibold text-destructive" role="alert" aria-live="assertive">
							{error}
						</p>
					)}
				</div>
				<div className="flex shrink-0 flex-wrap items-center gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={isSending}
						onClick={handleResend}
					>
						{isSending ? "Sending..." : "Resend verification email"}
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						aria-label="Dismiss email verification reminder"
						onClick={() => setDismissed(true)}
					>
						Not now
					</Button>
				</div>
			</div>
		</aside>
	);
};

export default EmailVerificationReminder;
