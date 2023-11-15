import React from "react";
import { Container } from "react-bootstrap";
import AccountForm from "../components/forms/AccountForm";
import "../styles/Account.scss";
const Account = () => {
	return (
		<Container fluid className="main">
			<div className="blur">
				<AccountForm />
			</div>
		</Container>
	);
};

export default Account;
