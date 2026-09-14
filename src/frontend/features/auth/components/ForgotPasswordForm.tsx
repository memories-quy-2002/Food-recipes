import {
	useState,
	type ChangeEvent,
	type FormEvent,
	type ReactElement,
} from "react";
import * as Yup from "yup";
import Button from "@/shared/ui/Button";
import Input from "@/shared/ui/Input";
import Label from "@/shared/ui/Label";
import {
	getSafeAuthErrorMessage,
	requestPasswordReset,
} from "@/features/auth/api/passwordRecoveryApi";

const emailSchema = Yup.object({
	email: Yup.string()
		.email("Enter a valid email address.")
		.required("Email is required."),
});

export type ForgotPasswordFormProps = {
	onLogin: () => void;
};

const ForgotPasswordForm = ({
	onLogin,
}: ForgotPasswordFormProps): ReactElement => {
	const [email, setEmail] = useState("");
	const [fieldError, setFieldError] = useState<string | null>(null);
	const [generalError, setGeneralError] = useState<string | null>(null);
	const [status, setStatus] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
		setEmail(event.target.value);
		setFieldError(null);
		setGeneralError(null);
		setStatus(null);
	};

	const handleSubmit = async (
		event: FormEvent<HTMLFormElement>,
	): Promise<void> => {
		event.preventDefault();
		if (isSubmitting) return;

		const normalizedEmail = email.trim();
		try {
			await emailSchema.validate(
				{ email: normalizedEmail },
				{ abortEarly: false },
			);
		} catch (error: unknown) {
			setFieldError(
				error instanceof Yup.ValidationError
					? error.errors[0] ?? "Enter a valid email address."
					: "Enter a valid email address.",
			);
			setGeneralError(null);
			setStatus(null);
			return;
		}

		setFieldError(null);
		setGeneralError(null);
		setStatus(null);
		setIsSubmitting(true);
		try {
			await requestPasswordReset(normalizedEmail);
			setStatus(
				"If an account matches that email, we sent recovery instructions. Check your inbox and spam folder.",
			);
		} catch (error: unknown) {
			setGeneralError(
				getSafeAuthErrorMessage(
					error,
					"We could not request recovery instructions right now. Please try again.",
				),
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			noValidate
			className="grid gap-5"
			aria-labelledby="forgot-password-title"
		>
			<div className="mb-1">
				<p className="text-xs font-black uppercase tracking-[0.14em] text-primary">
					Account recovery
				</p>
				<h2
					id="forgot-password-title"
					className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl"
				>
					Reset your password
				</h2>
				<p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
					Enter your email and we will send recovery instructions if an account
					matches it.
				</p>
			</div>

			<div className="grid gap-2">
				<Label htmlFor="forgot-password-email">Email address</Label>
				<Input
					id="forgot-password-email"
					name="email"
					type="email"
					required
					autoComplete="email"
					placeholder="you@example.com"
					value={email}
					onChange={handleChange}
					aria-invalid={Boolean(fieldError)}
					aria-describedby={fieldError ? "forgot-password-email-error" : undefined}
				/>
				{fieldError && (
					<p
						id="forgot-password-email-error"
						className="text-sm text-destructive"
					>
						{fieldError}
					</p>
				)}
			</div>

			{generalError && (
				<p
					role="alert"
					aria-live="assertive"
					className="rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive"
				>
					{generalError}
				</p>
			)}

			{status && (
				<p
					role="status"
					aria-live="polite"
					className="rounded-xl border border-primary/25 bg-primary/10 p-3 text-sm leading-6 text-foreground"
				>
					{status}
				</p>
			)}

			<Button
				type="submit"
				size="lg"
				className="h-13 w-full rounded-xl text-base font-black"
				disabled={isSubmitting}
			>
				{isSubmitting
					? "Sending recovery instructions..."
					: "Send recovery instructions"}
			</Button>

			<Button
				type="button"
				variant="link"
				className="mx-auto h-auto px-1 font-black text-primary"
				onClick={onLogin}
			>
				Back to log in
			</Button>
		</form>
	);
};

export default ForgotPasswordForm;
