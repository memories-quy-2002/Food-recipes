import React, { useMemo, useState } from "react";
import {
	BsArrowRight,
	BsCheckCircle,
	BsEnvelope,
	BsEye,
	BsEyeSlash,
	BsLock,
	BsPerson,
} from "react-icons/bs";
import useSignupForm from "@/features/auth/hooks/useSignupForm";
import Button from "@/shared/ui/Button";
import { cn } from "@/shared/lib/utils";

const fieldClass =
	"h-12 w-full border-0 bg-transparent px-0 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground/70 focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60";

const Field = ({ id, label, icon: Icon, children }) => (
	<div>
		<label htmlFor={id} className="mb-2 block text-sm font-black text-foreground">
			{label} <span className="text-primary">*</span>
		</label>
		<div className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-card px-3 shadow-sm transition focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/10">
			<Icon className="shrink-0 text-muted-foreground" aria-hidden="true" />
			{children}
		</div>
	</div>
);

const SignupForm = ({ onLogin }) => {
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [
		formData,
		validated,
		errors,
		isSubmitting,
		handleName,
		handleChange,
		handleSubmit,
	] = useSignupForm();

	const passwordStrength = useMemo(() => {
		const password = formData.password;
		let score = 0;
		if (password.length >= 8) score += 1;
		if (/[A-Z]/.test(password)) score += 1;
		if (/[0-9]/.test(password)) score += 1;
		if (/[^A-Za-z0-9]/.test(password)) score += 1;

		const labels = ["Add a password", "Weak", "Fair", "Good", "Strong"];
		return {
			score,
			label: labels[score],
			width: `${Math.max(score, password ? 1 : 0) * 25}%`,
		};
	}, [formData.password]);

	const passwordChecks = [
		{ label: "8 characters", passed: formData.password.length >= 8 },
		{ label: "Uppercase letter", passed: /[A-Z]/.test(formData.password) },
		{ label: "Number", passed: /[0-9]/.test(formData.password) },
		{ label: "Special character", passed: /[^A-Za-z0-9]/.test(formData.password) },
	];

	return (
		<form
			noValidate
			data-validated={validated ? "true" : "false"}
			onSubmit={handleSubmit}
			className="grid gap-5"
		>
			<div className="mb-1">
				<p className="text-xs font-black uppercase tracking-[0.14em] text-primary">Sign up</p>
				<h2 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
					Create your kitchen profile
				</h2>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<Field id="signup-first" label="First name" icon={BsPerson}>
					<input id="signup-first" className={fieldClass} type="text" name="first" required aria-required="true" placeholder="First name" autoComplete="given-name" value={formData.name.first} onChange={handleName} />
				</Field>
				<Field id="signup-last" label="Last name" icon={BsPerson}>
					<input id="signup-last" className={fieldClass} type="text" name="last" required aria-required="true" placeholder="Last name" autoComplete="family-name" value={formData.name.last} onChange={handleName} />
				</Field>
			</div>

			<Field id="signup-email" label="Email address" icon={BsEnvelope}>
				<input id="signup-email" className={fieldClass} type="email" name="email" required aria-required="true" placeholder="you@example.com" autoComplete="email" value={formData.email} onChange={handleChange} />
			</Field>

			<div>
				<Field id="signup-password" label="Password" icon={BsLock}>
					<input id="signup-password" className={fieldClass} type={showPassword ? "text" : "password"} name="password" required aria-required="true" placeholder="Password" autoComplete="new-password" value={formData.password} onChange={handleChange} />
					<Button type="button" variant="ghost" size="icon" className="size-10 shrink-0 rounded-full text-muted-foreground hover:text-foreground" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
						{showPassword ? <BsEyeSlash aria-hidden="true" /> : <BsEye aria-hidden="true" />}
					</Button>
				</Field>
				<div className="mt-3 flex items-center gap-3 text-xs font-bold text-muted-foreground">
					<div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
						<span
							className={cn(
								"block h-full rounded-full transition-all",
								passwordStrength.score <= 1 && "bg-destructive",
								passwordStrength.score === 2 && "bg-primary",
								passwordStrength.score === 3 && "bg-amber-600",
								passwordStrength.score === 4 && "bg-emerald-600"
							)}
							style={{ width: passwordStrength.width }}
						/>
					</div>
					<span>{passwordStrength.label}</span>
				</div>
				<ul className="mt-3 flex flex-wrap gap-2" aria-label="Password requirements">
					{passwordChecks.map((check) => (
						<li key={check.label} className={cn("rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground", check.passed && "bg-emerald-100 text-emerald-800")}>
							{check.label}
						</li>
					))}
				</ul>
			</div>

			<Field id="signup-confirm-password" label="Confirm password" icon={BsLock}>
				<input id="signup-confirm-password" className={fieldClass} type={showConfirmPassword ? "text" : "password"} name="confirmPassword" required aria-required="true" placeholder="Confirm password" autoComplete="new-password" value={formData.confirmPassword} onChange={handleChange} />
				<Button type="button" variant="ghost" size="icon" className="size-10 shrink-0 rounded-full text-muted-foreground hover:text-foreground" onClick={() => setShowConfirmPassword((value) => !value)} aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}>
					{showConfirmPassword ? <BsEyeSlash aria-hidden="true" /> : <BsEye aria-hidden="true" />}
				</Button>
			</Field>

			<Button type="submit" size="lg" className="h-13 w-full rounded-xl text-base font-black" disabled={isSubmitting}>
				<span>{isSubmitting ? "Creating account…" : "Sign up"}</span>
				<BsArrowRight aria-hidden="true" />
			</Button>

			{validated && (
				<p className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
					<BsCheckCircle aria-hidden="true" />
					Account created successfully.
				</p>
			)}

			{errors.length > 0 && (
				<div className="grid gap-2" role="alert">
					{errors.map((error) => (
						<p key={error} className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-center text-sm font-semibold text-destructive">
							{error}
						</p>
					))}
				</div>
			)}

			<p className="text-center text-sm text-muted-foreground">
				Already have an account?{" "}
				<Button type="button" variant="link" className="h-auto px-1 py-0 font-black text-primary" onClick={onLogin}>
					Log in
				</Button>
			</p>
		</form>
	);
};

export default SignupForm;
