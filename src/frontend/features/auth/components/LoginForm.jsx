import React, { useState } from "react";
import { BsArrowRight, BsEnvelope, BsEye, BsEyeSlash, BsLock } from "react-icons/bs";
import useLoginForm from "@/features/auth/hooks/useLoginForm";
import Button from "@/shared/ui/Button";

const fieldClass =
	"h-12 w-full border-0 bg-transparent px-0 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground/70 focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60";

const LoginForm = ({ onSignup }) => {
	const [showPassword, setShowPassword] = useState(false);
	const [
		formData,
		remember,
		validated,
		errors,
		isSubmitting,
		handleChange,
		handleRemember,
		handleSubmit,
	] = useLoginForm();

	return (
		<form
			action="/post/login"
			method="POST"
			noValidate
			data-validated={validated ? "true" : "false"}
			onSubmit={handleSubmit}
			className="grid gap-5"
		>
			<div className="mb-1">
				<p className="text-xs font-black uppercase tracking-[0.14em] text-primary">Log in</p>
				<h2 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
					Continue cooking
				</h2>
			</div>

			<div>
				<label htmlFor="login-email" className="mb-2 block text-sm font-black text-foreground">
					Email address <span className="text-primary">*</span>
				</label>
				<div className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-card px-3 shadow-sm transition focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/10">
					<BsEnvelope className="shrink-0 text-muted-foreground" aria-hidden="true" />
					<input
						id="login-email"
						className={fieldClass}
						type="email"
						name="email"
						required
						aria-required="true"
						placeholder="you@example.com"
						autoComplete="email"
						value={formData.email}
						onChange={handleChange}
					/>
				</div>
			</div>

			<div>
				<label htmlFor="login-password" className="mb-2 block text-sm font-black text-foreground">
					Password <span className="text-primary">*</span>
				</label>
				<div className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-card px-3 shadow-sm transition focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/10">
					<BsLock className="shrink-0 text-muted-foreground" aria-hidden="true" />
					<input
						id="login-password"
						className={fieldClass}
						type={showPassword ? "text" : "password"}
						name="password"
						required
						aria-required="true"
						placeholder="Password"
						autoComplete="current-password"
						value={formData.password}
						onChange={handleChange}
					/>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="size-10 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
						onClick={() => setShowPassword((value) => !value)}
						aria-label={showPassword ? "Hide password" : "Show password"}
					>
						{showPassword ? <BsEyeSlash aria-hidden="true" /> : <BsEye aria-hidden="true" />}
					</Button>
				</div>
			</div>

			<label className="inline-flex w-fit cursor-pointer items-center gap-2 text-sm font-semibold text-foreground">
				<input
					type="checkbox"
					name="remember"
					checked={remember}
					onChange={handleRemember}
					className="size-4 rounded border-border accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
				/>
				Remember me
			</label>

			{errors.length > 0 && (
				<div className="grid gap-2" role="alert">
					{errors.map((error) => (
						<p key={error} className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
							{error}
						</p>
					))}
				</div>
			)}

			<Button type="submit" size="lg" className="h-13 w-full rounded-xl text-base font-black" disabled={isSubmitting}>
				<span>{isSubmitting ? "Signing in…" : "Log in"}</span>
				<BsArrowRight aria-hidden="true" />
			</Button>

			<p className="text-center text-sm text-muted-foreground">
				Don't have an account?{" "}
				<Button type="button" variant="link" className="h-auto px-1 py-0 font-black text-primary" onClick={onSignup}>
					Register
				</Button>
			</p>
		</form>
	);
};

export default LoginForm;
