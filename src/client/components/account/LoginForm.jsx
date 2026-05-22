import React, { useState } from "react";
import { Button, Form } from "react-bootstrap";
import { BsArrowRight, BsEnvelope, BsEye, BsEyeSlash, BsLock } from "react-icons/bs";
import useLoginForm from "../../hooks/useLoginForm";

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
		<div className="form__login">
			<Form
				action="/post/login"
				method="POST"
				noValidate
				validated={validated}
				onSubmit={handleSubmit}
				className="form__login__container"
			>
				<div className="form__heading">
					<p>Log in</p>
					<h2>Continue cooking</h2>
				</div>
				<Form.Group className="form__login__container__email">
					<Form.Label className="form__login__container__label">
						Email address{" "}
						<span className="form__login__container__label--required">
							*
						</span>
					</Form.Label>
					<div className="form__field">
						<BsEnvelope aria-hidden="true" />
						<Form.Control
							className="form__login__container__input"
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
				<Form.Group className="form__login__container__pwd">
					<Form.Label className="form__login__container__label">
						Password{" "}
						<span className="form__login__container__label--required">
							*
						</span>
					</Form.Label>
					<div className="form__field">
						<BsLock aria-hidden="true" />
						<Form.Control
							className="form__login__container__input"
							type={showPassword ? "text" : "password"}
							name="password"
							required
							aria-required
							placeholder="Password"
							autoComplete="current-password"
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
				</Form.Group>
				<div className="form__login__container__checked">
					<input
						id="remember"
						type="checkbox"
						name="remember"
						checked={remember}
						onChange={handleRemember}
					/>
					<label htmlFor="remember">Remember me</label>
				</div>
				{errors.length > 0 && (
					<div className="form__login__container__error" role="alert">
						{errors.map((error) => (
							<p className="alert alert-danger" key={error}>
								{error}
							</p>
						))}
					</div>
				)}
				<Button
					type="submit"
					className="form__login__container__submit"
					disabled={isSubmitting}
				>
					<span>{isSubmitting ? "Signing in..." : "Log in"}</span>
					<BsArrowRight aria-hidden="true" />
				</Button>
				<div className="form__login__container__bottom">
					<p>
						Don't have an account?{" "}
						<button
							type="button"
							onClick={onSignup}
							className="form__login__container__bottom__button"
						>
							Register
						</button>
					</p>
				</div>
			</Form>
		</div>
	);
};

export default LoginForm;
