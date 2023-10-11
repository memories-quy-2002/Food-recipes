import React, { useState } from "react";
import { Button, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const LoginForm = () => {
	const [validated, setValidated] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [errors, setErrors] = useState([]);
	const navigate = useNavigate();
	const handleSubmitLogin = (event) => {
		event.preventDefault();
		setValidated(true);
		if (!email || !password) {
			setErrors(["Please fill in all fields!"]);
			return;
		} else if (password.length < 8) {
			setErrors(["Password must be 8 characters or more!"]);
			return;
		}
		navigate("./");
	};
	return (
		<div className="form__login">
			<Form
				action="/post/login"
				method="POST"
				noValidate
				validated={validated}
				onSubmit={handleSubmitLogin}
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
						required
						aria-required
						placeholder="Email"
						value={email}
						onChange={(e) => {
							setEmail(e.target.value);
							console.log("Login:" + email);
						}}
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
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
				</Form.Group>
				<div className="form__login__container__checked">
					<input type="checkbox" name="remember_box" />
					<label htmlFor="remember_box">Remember me</label>
				</div>
				<Button
					type="submit"
					className="form__login__container__submit"
				>
					Log In
				</Button>
				{errors.length > 0 && (
					<div className="alert alert-danger text-center">
						{errors.map((error) => (
							<p key={error}>{error}</p>
						))}
					</div>
				)}
			</Form>
		</div>
	);
};

export default LoginForm;
