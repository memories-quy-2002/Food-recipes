import React, { useState } from "react";
import { Form, Button, Row, Col } from "react-bootstrap";
import Layout from "../components/layout/Layout";
import { useNavigate } from "react-router-dom";
import "../styles/Signup.scss";
const Signup = () => {
	const [name, setName] = useState({ first: "", middle: "", last: "" });
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [validated, setValidated] = useState(false);
	const [errors, setErrors] = useState([]);
	const navigate = useNavigate();
	const handleSubmit = (event) => {
		event.preventDefault();
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
		setValidated(true);
		navigate("/");
	};
	return (
		<Layout>
			<div className="container-fluid main-content">
				<h3 className="title">Get started</h3>
				<Form
					action="/"
					method="POST"
					noValidate
					validated={validated}
					onSubmit={handleSubmit}
					className="container form"
				>
					<Row className="form__nameGroup">
						<Form.Group as={Col} className="form__name">
							<Form.Label className="form__label ">
								First name <span className="required">*</span>
							</Form.Label>
							<Form.Control
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
						<Form.Group as={Col} className="form__name">
							<Form.Label className="form__label">
								Middle name <span className="required">*</span>
							</Form.Label>
							<Form.Control
								type="text"
								required
								aria-required
								placeholder="Middle name"
								onChange={(e) =>
									setName({
										...name,
										middle: e.target.value,
									})
								}
							/>
						</Form.Group>
						<Form.Group as={Col} className="form__name">
							<Form.Label className="form__label">
								Last name <span className="required">*</span>
							</Form.Label>
							<Form.Control
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

					<Form.Group className="form__email">
						<Form.Label className="form__label">
							Email address <span className="required">*</span>
						</Form.Label>
						<Form.Control
							type="email"
							required
							aria-required
							placeholder="Email"
							onChange={(e) => setEmail(e.target.value)}
						/>
					</Form.Group>
					<Form.Group className="form__pwd">
						<Form.Label className="form__label">
							Password <span className="required">*</span>
						</Form.Label>
						<Form.Control
							type="password"
							required
							aria-required
							placeholder="Password"
							onChange={(e) => setPassword(e.target.value)}
						/>
					</Form.Group>
					<Form.Group className="form__pwd">
						<Form.Label className="form__label">
							Confirm password <span className="required">*</span>
						</Form.Label>
						<Form.Control
							type="password"
							required
							aria-required
							placeholder="Confirm Password"
							onChange={(e) => setConfirmPassword(e.target.value)}
						/>
					</Form.Group>
					<Form.Check
						required
						label="Agree to terms and conditions"
						feedback="You must agree before submitting."
						feedbackType="invalid"
						className="form__check"
					/>
					<Button type="submit" className="form__submit">
						Sign Up
					</Button>

					{errors.length > 0 && (
						<div className="alert alert-danger">
							{errors.map((error) => (
								<p key={error}>{error}</p>
							))}
						</div>
					)}
					<div className="form__bottom">
						<p>
							Already have an account? <a href="/login">Log in</a>
						</p>
					</div>
				</Form>
			</div>
		</Layout>
	);
};

export default Signup;
