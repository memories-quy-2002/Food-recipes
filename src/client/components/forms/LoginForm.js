import React, { useState } from "react";
import { Button, Form } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import { authActions } from "../../redux/authSlice";
import * as constants from "../../utils/constant";
const LoginForm = () => {
	const [validated, setValidated] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [errors, setErrors] = useState([]);
	const navigate = useNavigate();
	const dispatch = useDispatch();

	const handleSubmitLogin = async (e) => {
		e.preventDefault();
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
		try {
			const response = await axios.post(
				"http://localhost:4000/account/login",
				JSON.stringify({ email, password }),
				{
					headers: { "Content-Type": "application/json" },
					withCredentials: true,
				}
			);
			if (response.status === 200) {
				const user = response.data.user;
				const token = response.data.token;
				const payload = { user, token };
				dispatch(authActions.login(payload));
				navigate("/");
			}
		} catch (error) {
			if (error.response && error.response.status === 401) {
				// Show error message to user
				console.error(error.response.data.message);
			} else {
				console.error(error);
			}
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
