import React from "react";
import { useState } from "react";
import { Form, Row, Col, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const SignupForm = () => {
	const [name, setName] = useState({ first: "", last: "" });
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [validated, setValidated] = useState(false);
	const [errors, setErrors] = useState([]);
	const navigate = useNavigate();
	const handleSubmit = (event) => {
		event.preventDefault();

		setValidated(true);
		if (!name || !email || !password || !confirmPassword) {
			setErrors(["Please fill in all fields!"]);
			return;
		} else if (password.length < 8) {
			setErrors(["Password must be 8 characters or more!"]);
			return;
		} else if (password !== confirmPassword) {
			setErrors(["Confirmed password is not matched!"]);
			return;
		}
		navigate("/");
	};
	return (
		<div className="form">
			<Form
				action="/"
				method="POST"
				noValidate
				validated={validated}
				onSubmit={handleSubmit}
				className="container form__container"
			>
				<h3 className="form__title">Get started</h3>
				<Row className="form__container__nameGroup">
					<Form.Group as={Col} className="form__container__name">
						<Form.Label className="form__container__label ">
							First name{" "}
							<span className="form__container__label--required">
								*
							</span>
						</Form.Label>
						<Form.Control
							className="form__container__input"
							type="text"
							required
							aria-required
							placeholder="First name"
							onChange={(e) =>
								setName({
									...name,
									first: e.target.value,
								})
							}
						/>
					</Form.Group>

					<Form.Group as={Col} className="form__container__name">
						<Form.Label className="form__container__label">
							Last name{" "}
							<span className="form__container__label--required">
								*
							</span>
						</Form.Label>
						<Form.Control
							className="form__container__input"
							type="text"
							required
							aria-required
							placeholder="Last name"
							onChange={(e) =>
								setName({
									...name,
									last: e.target.value,
								})
							}
						/>
					</Form.Group>
				</Row>

				<Form.Group className="form__container__email">
					<Form.Label className="form__container__label">
						Email address{" "}
						<span className="form__container__label--required">
							*
						</span>
					</Form.Label>
					<Form.Control
						className="form__container__input"
						type="email"
						required
						aria-required
						placeholder="Email"
						onChange={(e) => setEmail(e.target.value)}
					/>
				</Form.Group>
				<Form.Group className="form__container__pwd">
					<Form.Label className="form__container__label">
						Password{" "}
						<span className="form__container__label--required">
							*
						</span>
					</Form.Label>
					<Form.Control
						className="form__container__input"
						type="password"
						required
						aria-required
						placeholder="Password"
						onChange={(e) => setPassword(e.target.value)}
					/>
				</Form.Group>
				<Form.Group className="form__container__pwd">
					<Form.Label className="form__container__label">
						Confirm password{" "}
						<span className="form__container__label--required">
							*
						</span>
					</Form.Label>
					<Form.Control
						className="form__container__input"
						type="password"
						required
						aria-required
						placeholder="Confirm Password"
						onChange={(e) => setConfirmPassword(e.target.value)}
					/>
				</Form.Group>
				<div className="form__container__checked">
					<input type="checkbox" />
					<label>Agree to terms and conditions</label>
				</div>
				<Button type="submit" className="form__container__submit">
					Sign Up
				</Button>

				{errors.length > 0 && (
					<div className="alert alert-danger">
						{errors.map((error) => (
							<p key={error}>{error}</p>
						))}
					</div>
				)}
				<div className="form__container__bottom">
					<p>
						Already have an account? <a href="/login">Log in</a>
					</p>
				</div>
			</Form>
		</div>
	);
};

export default SignupForm;
