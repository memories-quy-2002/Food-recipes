import React from "react";
import { Button, Form } from "react-bootstrap";
import useLoginForm from "../../hooks/useLoginForm";
const LoginForm = () => {
	const [formData, validated, errors, handleChange, handleSubmit] =
		useLoginForm();
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
				<h3 className="form__login__container__title">Welcome back</h3>
				<Form.Group className="form__login__container__email">
					<Form.Label className="form__login__container__label">
						Email address{" "}
						<span className="form__login__container__label--required">
							*
						</span>
					</Form.Label>
					<Form.Control
						className="form__login__container__input"
						type="email"
						name="email"
						required
						aria-required
						placeholder="Email"
						value={formData.email}
						onChange={handleChange}
					/>
				</Form.Group>
				<Form.Group className="form__login__container__pwd">
					<Form.Label className="form__login__container__label">
						Password{" "}
						<span className="form__login__container__label--required">
							*
						</span>
					</Form.Label>
					<Form.Control
						className="form__login__container__input"
						type="password"
						name="password"
						required
						aria-required
						placeholder="Password"
						value={formData.password}
						onChange={handleChange}
					/>
				</Form.Group>
				<div className="form__login__container__checked">
					<input type="checkbox" name="remember_box" />
					<label htmlFor="remember_box">Remember me</label>
				</div>
				{errors.length > 0 && (
					<div className="form__login__container__error">
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
				>
					Log In
				</Button>
			</Form>
		</div>
	);
};

export default LoginForm;
