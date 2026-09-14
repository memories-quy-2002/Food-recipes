import { useEffect, useRef, useState, type ReactElement } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useSearchParams } from "react-router-dom";
import {
	getSafeAuthErrorMessage,
	verifyEmail,
} from "@/features/auth/api/passwordRecoveryApi";
import { authActions } from "@/features/auth/state/authSlice";
import type { RootState } from "@/app/store";
import PageHelmet from "@/shared/seo/PageHelmet";
import Button from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";

type VerificationState = "loading" | "success" | "error";

const missingTokenMessage =
	"This verification link is missing or invalid. Ask for a new verification email to continue.";

const VerifyEmail = (): ReactElement => {
	const [searchParams] = useSearchParams();
	const dispatch = useDispatch();
	const { local, session } = useSelector((state: RootState) => state.auth);
	const isAuthenticated = local.isAuthenticated || session.isAuthenticated;
	const user = local.isAuthenticated ? local.user : session.user;
	const requestToken = useRef<string | null>(null);
	const token = searchParams.get("token")?.trim() ?? "";
	const [state, setState] = useState<VerificationState>(
		token ? "loading" : "error",
	);
	const [message, setMessage] = useState(
		token ? "Verifying your email..." : missingTokenMessage,
	);

	useEffect(() => {
		const currentToken = searchParams.get("token")?.trim();
		if (!currentToken) {
			setState("error");
			setMessage(missingTokenMessage);
			return;
		}
		if (requestToken.current === currentToken) return;

		requestToken.current = currentToken;
		setState("loading");
		setMessage("Verifying your email...");
		let active = true;

		void verifyEmail(currentToken)
			.then(() => {
				if (!active) return;
				setState("success");
				setMessage(
					"Your email is verified. You can now use your Food Recipes account.",
				);
				if (isAuthenticated && user) {
					dispatch(
						authActions.updateUser({
							user: { ...user, email_verified: true },
						}),
					);
				}
			})
			.catch((error: unknown) => {
				if (!active) return;
				setState("error");
				setMessage(
					getSafeAuthErrorMessage(
						error,
						"This verification link is invalid or has expired. Ask for a new verification email to continue.",
					),
				);
			});

		return () => {
			active = false;
		};
	}, [dispatch, isAuthenticated, searchParams, user]);

	const isLoading = state === "loading";
	const isSuccess = state === "success";
	const heading = isLoading
		? "Verifying your email"
		: isSuccess
			? "Email verified"
			: "Verification link unavailable";
	const linkLabel = isSuccess
		? isAuthenticated
			? "Go to your profile"
			: "Go to log in"
		: isAuthenticated
			? "Go to your account"
			: "Go to log in";
	const linkTarget =
		isSuccess && isAuthenticated ? "/profile" : "/account?signup=false";

	return (
		<main className="min-h-[calc(100vh-5rem)] w-full bg-background px-3 py-5 text-foreground sm:px-6 sm:py-8 lg:px-10 lg:py-12">
			<PageHelmet
				title="Verify email"
				description="Verify your Food Recipes account email."
				path="/account/verify-email"
				noIndex
			/>
			<div className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-xl items-center justify-center">
				<Card
					className="w-full p-5 shadow-xl shadow-foreground/10 sm:p-8 lg:p-10"
					role={isLoading || isSuccess ? "status" : "alert"}
					aria-live={isLoading || isSuccess ? "polite" : "assertive"}
					aria-labelledby="verify-email-title"
				>
					<div className="grid gap-5">
						<div>
							<p className="text-xs font-black uppercase tracking-[0.14em] text-primary">
								Email verification
							</p>
							<h1
								id="verify-email-title"
								className="mt-2 text-3xl font-black tracking-tight sm:text-4xl"
							>
								{heading}
							</h1>
						</div>
						<p className="text-sm leading-6 text-muted-foreground">{message}</p>
						{!isLoading && (
							<Button asChild size="lg" className="w-full">
								<Link to={linkTarget}>{linkLabel}</Link>
							</Button>
						)}
					</div>
				</Card>
			</div>
		</main>
	);
};

export default VerifyEmail;
