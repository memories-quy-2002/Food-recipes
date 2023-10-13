import React, { useEffect, useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import * as constants from "../../utils/constant";
const SignupForm = () => {
	const [name, setName] = useState({ first: "", last: "" });
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [validated, setValidated] = useState(false);
	const [errors, setErrors] = useState([]);
	const navigate = useNavigate();
	useEffect(() => {
		setErrors([]);
	}, [name, email, password, confirmPassword]);
	const handleSubmitSignup = async (e) => {
		e.preventDefault();
		setValidated(true);
		if (!name || !email || !password || !confirmPassword) {
			setErrors(["Please fill in all fields"]);
		}
		const e1 = constants.EMAIL_REGEX.test(email);
		const e2 = constants.PWD_REGEX.test(password);
		const e3 = constants.PWD_REGEX.test(confirmPassword);
		if (!e1) {
			setErrors(["Invalid email"]);
			return;
		} else if (!e2) {
			setErrors(["Invalid password"]);
			return;
		} else if (!e3) {
			setErrors(["Invalid confirm password"]);
			return;
		} else if (password !== confirmPassword) {
			setErrors(["Confirm password is not matched"]);
			return;
		}
	};
	return (
		<div className="form__signup">
			<Form
				noValidate
				validated={validated}
				onSubmit={handleSubmitSignup}
				className="form__signup__container"
			>
				<h3 className="form__signup__container__title">Get started</h3>
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
						<Form.Control
							className="form__signup__container__input"
							type="text"
							required
							aria-required
							placeholder="First name"
							value={name.first}
							onChange={(e) =>
								setName({
									...name,
									first: e.target.value,
								})
							}
						/>
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
						<Form.Control
							className="form__signup__container__input"
							type="text"
							required
							aria-required
							placeholder="Last name"
							value={name.last}
							onChange={(e) =>
								setName({
									...name,
									last: e.target.value,
								})
							}
						/>
					</Form.Group>
				</Row>

				<Form.Group className="form__signup__container__email">
					<Form.Label className="form__signup__container__label">
						Email address{" "}
						<span className="form__signup__container__label--required">
							*
						</span>
					</Form.Label>
					<Form.Control
						className="form__signup__container__input"
						type="email"
						required
						aria-required
						placeholder="Email"
						value={email}
						onChange={(e) => {
							console.log("Signup:" + email);
							setEmail(e.target.value);
						}}
					/>
				</Form.Group>
				<Form.Group className="form__signup__container__pwd">
					<Form.Label className="form__signup__container__label">
						Password{" "}
						<span className="form__signup__container__label--required">
							*
						</span>
					</Form.Label>
					<Form.Control
						className="form__signup__container__input"
						type="password"
						required
						aria-required
						placeholder="Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
				</Form.Group>
				<Form.Group className="form__signup__container__pwd">
					<Form.Label className="form__signup__container__label">
						Confirm password{" "}
						<span className="form__signup__container__label--required">
							*
						</span>
					</Form.Label>
					<Form.Control
						className="form__signup__container__input"
						type="password"
						required
						aria-required
						placeholder="Confirm Password"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
					/>
				</Form.Group>
				<div className="form__signup__container__checked">
					<input type="checkbox" />
					<label>Agree to terms and conditions</label>
				</div>
				<Button
					type="submit"
					className="form__signup__container__submit"
				>
					Sign Up
				</Button>

				{errors.length > 0 && (
					<div className="alert alert-danger text-center">
						{errors.map((error) => (
							<p key={error}>{error}</p>
						))}
					</div>
				)}
				<div className="form__signup__container__bottom">
					<p>
						Already have an account? <a href="/login">Log in</a>
					</p>
				</div>
			</Form>
		</div>
	);
};

export default SignupForm;
