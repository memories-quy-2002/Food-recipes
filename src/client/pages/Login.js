import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import Layout from "../components/layout/Layout";
const Login = () => {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [errors, setErrors] = useState([]);

	const handleSubmit = (event) => {
		event.preventDefault();
		if (!username || !password) {
			setErrors(["Please fill in username and password."]);
			return;
		}
	};
	return (
		<Layout>
			<Form onSubmit={handleSubmit} className="container-fluid">
				<Form.Group>
					<Form.Label>Username</Form.Label>
					<Form.Control
						type="text"
						onChange={(e) => setUsername(e.target.value)}
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
		</Layout>
	);
};

export default Login;
