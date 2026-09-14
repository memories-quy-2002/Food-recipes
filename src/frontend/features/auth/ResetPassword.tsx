import {
	useState,
	type ChangeEvent,
	type FormEvent,
	type ReactElement,
} from "react";
import { Link, useSearchParams } from "react-router-dom";
import * as Yup from "yup";
import {
	getSafeAuthErrorMessage,
	resetPassword,
} from "@/features/auth/api/passwordRecoveryApi";
import PageHelmet from "@/shared/seo/PageHelmet";
import Button from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import Input from "@/shared/ui/Input";
import Label from "@/shared/ui/Label";

type ResetPasswordField = "newPassword" | "confirmPassword";
type ResetPasswordForm = Record<ResetPasswordField, string>;
type ResetPasswordErrors = Partial<Record<ResetPasswordField, string>>;

const resetPasswordSchema = Yup.object({
	newPassword: Yup.string()
		.min(8, "Password must be at least 8 characters.")
		.required("New password is required."),
	confirmPassword: Yup.string()
		.oneOf([Yup.ref("newPassword")], "Passwords must match.")
		.required("Confirm your new password."),
});

const initialForm: ResetPasswordForm = {
	newPassword: "",
	confirmPassword: "",
};

const getValidationErrors = (error: unknown): ResetPasswordErrors => {
	if (!(error instanceof Yup.ValidationError)) return {};

	const errors: ResetPasswordErrors = {};
	for (const validationError of error.inner.length > 0 ? error.inner : [error]) {
		if (
			(validationError.path === "newPassword" ||
				validationError.path === "confirmPassword") &&
			!errors[validationError.path]
		) {
			errors[validationError.path] = validationError.message;
		}
	}
	return errors;
};

const ResetPassword = (): ReactElement => {
	const [searchParams] = useSearchParams();
	const [form, setForm] = useState<ResetPasswordForm>(initialForm);
	const [fieldErrors, setFieldErrors] = useState<ResetPasswordErrors>({});
	const [generalError, setGeneralError] = useState<string | null>(() =>
		searchParams.get("token")?.trim()
			? null
			: "This recovery link is missing or invalid. Request a new link to continue.",
	);
	const [status, setStatus] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showPasswords, setShowPasswords] = useState(false);
	const hasToken = Boolean(searchParams.get("token")?.trim());

	const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
		const { name, value } = event.target;
		if (name !== "newPassword" && name !== "confirmPassword") return;
		setForm((current) => ({ ...current, [name]: value }));
		setFieldErrors((current) => ({ ...current, [name]: undefined }));
		setGeneralError(null);
		setStatus(null);
	};

	const handleSubmit = async (
		event: FormEvent<HTMLFormElement>,
	): Promise<void> => {
		event.preventDefault();
		if (isSubmitting) return;

		const token = searchParams.get("token")?.trim();
		if (!token) {
			setGeneralError(
				"This recovery link is missing or invalid. Request a new link to continue.",
			);
			return;
		}

		try {
			await resetPasswordSchema.validate(form, { abortEarly: false });
		} catch (error: unknown) {
			setFieldErrors(getValidationErrors(error));
			setGeneralError(null);
			setStatus(null);
			return;
		}

		setFieldErrors({});
		setGeneralError(null);
		setStatus(null);
		setIsSubmitting(true);
		try {
			await resetPassword(token, form.newPassword);
			setForm(initialForm);
			setShowPasswords(false);
			setStatus(
				"Your password has been reset. You can now log in with your new password.",
			);
		} catch (error: unknown) {
			setGeneralError(
				getSafeAuthErrorMessage(
					error,
					"We could not reset your password right now. Please try again.",
				),
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<main className="min-h-[calc(100vh-5rem)] w-full bg-background px-3 py-5 text-foreground sm:px-6 sm:py-8 lg:px-10 lg:py-12">
			<PageHelmet
				title="Reset password"
				description="Set a new Food Recipes account password."
				path="/account/reset-password"
				noIndex
			/>
			<div className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-xl items-center justify-center">
				<Card className="w-full p-5 shadow-xl shadow-foreground/10 sm:p-8 lg:p-10">
					{!hasToken ? (
						<section
							aria-labelledby="reset-password-error-title"
							role="alert"
							aria-live="assertive"
							className="grid gap-5"
						>
							<div>
								<p className="text-xs font-black uppercase tracking-[0.14em] text-primary">
									Account recovery
								</p>
								<h1
									id="reset-password-error-title"
									className="mt-2 text-3xl font-black tracking-tight sm:text-4xl"
								>
									Recovery link unavailable
								</h1>
							</div>
							<p className="text-sm leading-6 text-muted-foreground">
								{generalError}
							</p>
							<Button asChild size="lg" className="w-full">
								<Link to="/account?recovery=true">
									Request a new recovery link
								</Link>
							</Button>
						</section>
					) : status ? (
						<section
							aria-labelledby="reset-password-success-title"
							role="status"
							aria-live="polite"
							className="grid gap-5"
						>
							<div>
								<p className="text-xs font-black uppercase tracking-[0.14em] text-primary">
									Account recovery
								</p>
								<h1
									id="reset-password-success-title"
									className="mt-2 text-3xl font-black tracking-tight sm:text-4xl"
								>
									Password reset complete
								</h1>
							</div>
							<p className="text-sm leading-6 text-muted-foreground">
								{status}
							</p>
							<Button asChild size="lg" className="w-full">
								<Link to="/account?signup=false">Log in</Link>
							</Button>
						</section>
					) : (
						<form
							onSubmit={handleSubmit}
							noValidate
							className="grid gap-5"
							aria-labelledby="reset-password-title"
						>
							<div>
								<p className="text-xs font-black uppercase tracking-[0.14em] text-primary">
									Account recovery
								</p>
								<h1
									id="reset-password-title"
									className="mt-2 text-3xl font-black tracking-tight sm:text-4xl"
								>
									Set a new password
								</h1>
								<p className="mt-3 text-sm leading-6 text-muted-foreground">
									Choose a new password for your Food Recipes account.
								</p>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="reset-new-password">New password</Label>
								<div className="flex items-center gap-2">
									<Input
										id="reset-new-password"
										name="newPassword"
										type={showPasswords ? "text" : "password"}
										autoComplete="new-password"
										required
										value={form.newPassword}
										onChange={handleChange}
										aria-invalid={Boolean(fieldErrors.newPassword)}
										aria-describedby={[
											"reset-password-hint",
											fieldErrors.newPassword
												? "reset-new-password-error"
												: "",
										].filter(Boolean).join(" ")}
									/>
									<Button
										type="button"
										variant="outline"
										size="sm"
										className="shrink-0 px-3"
										onClick={() => setShowPasswords((value) => !value)}
										aria-pressed={showPasswords}
									>
										{showPasswords ? "Hide" : "Show"}
									</Button>
								</div>
								<p
									id="reset-password-hint"
									className="text-sm text-muted-foreground"
								>
									Use at least 8 characters. Password managers and paste are
									supported.
								</p>
								{fieldErrors.newPassword && (
									<p
										id="reset-new-password-error"
										className="text-sm text-destructive"
									>
										{fieldErrors.newPassword}
									</p>
								)}
							</div>

							<div className="grid gap-2">
								<Label htmlFor="reset-confirm-password">
									Confirm new password
								</Label>
								<Input
									id="reset-confirm-password"
									name="confirmPassword"
									type={showPasswords ? "text" : "password"}
									autoComplete="new-password"
									required
									value={form.confirmPassword}
									onChange={handleChange}
									aria-invalid={Boolean(fieldErrors.confirmPassword)}
									aria-describedby={
										fieldErrors.confirmPassword
											? "reset-confirm-password-error"
											: undefined
									}
								/>
								{fieldErrors.confirmPassword && (
									<p
										id="reset-confirm-password-error"
										className="text-sm text-destructive"
									>
										{fieldErrors.confirmPassword}
									</p>
								)}
							</div>

							{generalError && (
								<div
									role="alert"
									aria-live="assertive"
									className="grid gap-2 rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive"
								>
									<p>{generalError}</p>
									<Button
										asChild
										variant="link"
										className="h-auto justify-start px-0 font-black text-destructive"
									>
										<Link to="/account?recovery=true">
											Request a new recovery link
										</Link>
									</Button>
								</div>
							)}

							<Button
								type="submit"
								size="lg"
								className="w-full"
								disabled={isSubmitting}
							>
								{isSubmitting ? "Resetting password..." : "Reset password"}
							</Button>
						</form>
					)}
				</Card>
			</div>
		</main>
	);
};

export default ResetPassword;
