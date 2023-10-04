import React from "react";
import SignupBackground from "../components/forms/signup/SignupBackground";
import SignupForm from "../components/forms/signup/SignupForm";
import "../styles/Signup.scss";
import { Container } from "react-bootstrap";
const Signup = () => {
	return (
		<Container fluid>
			<div className="main-content">
				<SignupBackground />
				<SignupForm />
			</div>
		</Container>
	);
};

export default Signup;
