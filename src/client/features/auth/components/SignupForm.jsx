import React, { useMemo, useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
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
		{
			label: "Special character",
			passed: /[^A-Za-z0-9]/.test(formData.password),
		},
	];

	return (
		<div className="form__signup">
			<Form
				noValidate
				validated={validated}
				onSubmit={handleSubmit}
				className="form__signup__container"
			>
				<div className="form__heading">
					<p>Sign up</p>
					<h2>Create your kitchen profile</h2>
				</div>
				<Row className="form__signup__container__nameGroup">
					<Form.Group
						as={Col}
						className="form__signup__container__name"
					>
						<Form.Label className="form__signup__container__label ">
							First name{" "}
							<span className="form__signup__container__label--required">
								*
							</span>
						</Form.Label>
						<div className="form__field">
							<BsPerson aria-hidden="true" />
							<Form.Control
								className="form__signup__container__input"
								type="text"
								name="first"
								required
								aria-required
								placeholder="First name"
								autoComplete="given-name"
								value={formData.name.first}
								onChange={handleName}
							/>
						</div>
					</Form.Group>

					<Form.Group
						as={Col}
						className="form__signup__container__name"
					>
						<Form.Label className="form__signup__container__label">
							Last name{" "}
							<span className="form__signup__container__label--required">
								*
							</span>
						</Form.Label>
						<div className="form__field">
							<BsPerson aria-hidden="true" />
							<Form.Control
								className="form__signup__container__input"
								type="text"
								name="last"
								required
								aria-required
								placeholder="Last name"
								autoComplete="family-name"
								value={formData.name.last}
								onChange={handleName}
							/>
						</div>
					</Form.Group>
				</Row>

				<Form.Group className="form__signup__container__email">
					<Form.Label className="form__signup__container__label">
						Email address{" "}
						<span className="form__signup__container__label--required">
							*
						</span>
					</Form.Label>
					<div className="form__field">
						<BsEnvelope aria-hidden="true" />
						<Form.Control
							className="form__signup__container__input"
							type="email"
							name="email"
							required
							aria-required
							placeholder="you@example.com"
							autoComplete="email"
							value={formData.email}
							onChange={handleChange}
						/>
					</div>
				</Form.Group>
				<Form.Group className="form__signup__container__pwd">
					<Form.Label className="form__signup__container__label">
						Password{" "}
						<span className="form__signup__container__label--required">
							*
						</span>
					</Form.Label>
					<div className="form__field">
						<BsLock aria-hidden="true" />
						<Form.Control
							className="form__signup__container__input"
							type={showPassword ? "text" : "password"}
							name="password"
							required
							aria-required
							placeholder="Password"
							autoComplete="new-password"
							value={formData.password}
							onChange={handleChange}
						/>
						<button
							type="button"
							className="form__field__action"
							onClick={() => setShowPassword((value) => !value)}
							aria-label={showPassword ? "Hide password" : "Show password"}
						>
							{showPassword ? <BsEyeSlash /> : <BsEye />}
						</button>
					</div>
					<div className="form__strength">
						<div className="form__strength__track">
							<span
								className={`form__strength__bar form__strength__bar--${passwordStrength.score}`}
								style={{ width: passwordStrength.width }}
							/>
						</div>
						<span>{passwordStrength.label}</span>
					</div>
					<ul className="form__requirements" aria-label="Password requirements">
						{passwordChecks.map((check) => (
							<li
								key={check.label}
								className={
									check.passed
										? "form__requirements__item form__requirements__item--passed"
										: "form__requirements__item"
								}
							>
								{check.label}
							</li>
						))}
					</ul>
				</Form.Group>
				<Form.Group className="form__signup__container__pwd">
					<Form.Label className="form__signup__container__label">
						Confirm password{" "}
						<span className="form__signup__container__label--required">
							*
						</span>
					</Form.Label>
					<div className="form__field">
						<BsLock aria-hidden="true" />
						<Form.Control
							className="form__signup__container__input"
							type={showConfirmPassword ? "text" : "password"}
							name="confirmPassword"
							required
							aria-required
							placeholder="Confirm password"
							autoComplete="new-password"
							value={formData.confirmPassword}
							onChange={handleChange}
						/>
						<button
							type="button"
							className="form__field__action"
							onClick={() =>
								setShowConfirmPassword((value) => !value)
							}
							aria-label={
								showConfirmPassword
									? "Hide confirm password"
									: "Show confirm password"
							}
						>
							{showConfirmPassword ? <BsEyeSlash /> : <BsEye />}
						</button>
					</div>
				</Form.Group>
				<Button
					type="submit"
					className="form__signup__container__submit"
					disabled={isSubmitting}
				>
					<span>{isSubmitting ? "Creating account..." : "Sign up"}</span>
					<BsArrowRight aria-hidden="true" />
				</Button>

				{validated && (
					<p className="form__success">
						<BsCheckCircle aria-hidden="true" />
						Account created successfully.
					</p>
				)}

				{errors.length > 0 && (
					<div className="alert alert-danger text-center" role="alert">
						{errors.map((error) => (
							<p key={error}>{error}</p>
						))}
					</div>
				)}
				<div className="form__signup__container__bottom">
					<p>
						Already have an account?{" "}
						<button
							type="button"
							onClick={onLogin}
							className="form__signup__container__bottom__button"
						>
							Log in
						</button>
					</p>
				</div>
			</Form>
		</div>
	);
};

export default SignupForm;
