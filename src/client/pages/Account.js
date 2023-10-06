import React from "react";
import { Container } from "react-bootstrap";
import "../styles/Account.scss";
import AccountForm from "../components/forms/AccountForm";
const Account = () => {
	return (
		<Container fluid className="main">
			<AccountForm />
		</Container>
	);
};

export default Account;
