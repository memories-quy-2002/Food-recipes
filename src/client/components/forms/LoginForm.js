import React, { useEffect, useState } from "react";
import { Button, Form } from "react-bootstrap";

const LoginForm = () => {
	const [validated, setValidated] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [errors, setErrors] = useState([]);

	const handleSubmit = (e) => {
		e.preventDefault();
		setValidated(true);
		if (!email || !password) {
			setErrors(["Please fill in all fields!"]);
			return;
		} else if (password.length < 8) {
			setErrors(["Password must be 8 characters or more!"]);
			return;
		}
		console.log("Login success");
	};
	return (
		<div className="form__login">
			<Form
				action="/"
				method="POST"
				className="form__login__container"
				noValidate
				validated={validated}
				onSubmit={handleSubmit}
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
						required
						aria-required
						placeholder="Email"
						onChange={(e) => setEmail(e.target.value)}
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
						required
						aria-required
						placeholder="Password"
						onChange={(e) => setPassword(e.target.value)}
					/>
				</Form.Group>
			</Form>
			<div className="form__login__container__checked">
				<input type="checkbox" />
				<label>Remember me</label>
			</div>
			<Button type="submit" className="form__login__container__submit">
				Log in
			</Button>

			{errors.length > 0 && (
				<div className="alert alert-danger">
					{errors.map((error) => (
						<p key={error}>{error}</p>
					))}
				</div>
			)}
		</div>
	);
};

export default LoginForm;
