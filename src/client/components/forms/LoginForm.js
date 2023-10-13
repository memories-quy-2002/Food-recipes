import React, { useState } from "react";
import { Button, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import * as constants from "../../utils/constant";
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
		}
		const e1 = constants.EMAIL_REGEX.test(email);
		const e2 = constants.PWD_REGEX.test(password);
		if (!e1) {
			setErrors(["Invalid email"]);
			return;
		} else if (!e2) {
			setErrors(["Invalid password"]);
			return;
		}
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
