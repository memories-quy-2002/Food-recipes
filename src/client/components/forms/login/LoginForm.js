import React from "react";
import { useState } from "react";
import { Form, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const LoginForm = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [validated, setValidated] = useState(false);
	const [errors, setErrors] = useState([]);
	const navigate = useNavigate();

	const handleSubmit = (event) => {
		event.preventDefault();
		setValidated(true);
		if (!email || !password) {
			setErrors(["Please fill in email and password."]);
			return;
		} else if (password.length < 8) {
			setErrors(["Password must be 8 characters or more!"]);
			return;
		}
		navigate("/");
	};
	return (
		<Form
			action="/"
			method="POST"
			noValidate
			validated={validated}
			onSubmit={handleSubmit}
			className="container-fluid"
		>
			<Form.Group>
				<Form.Label>Email</Form.Label>
				<Form.Control
					type="text"
					onChange={(e) => setEmail(e.target.value)}
				/>
			</Form.Group>
			<Form.Group>
				<Form.Label>Password</Form.Label>
				<Form.Control
					type="password"
					onChange={(e) => setPassword(e.target.value)}
				/>
			</Form.Group>
			<Form.Check label="Stay signed in" />
			<Button type="submit">Submit</Button>
			{errors.length > 0 && (
				<div className="alert alert-danger">
					{errors.map((error) => (
						<p key={error}>{error}</p>
					))}
				</div>
			)}
		</Form>
	);
};

export default LoginForm;
