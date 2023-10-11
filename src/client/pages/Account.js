import React from "react";
import { Container } from "react-bootstrap";
import "../styles/Account.scss";
import AccountForm from "../components/forms/AccountForm";
import Layout from "../components/layout/Layout";
const Account = () => {
	return (
		<Layout>
			<Container fluid className="main">
				<div className="blur">
					<AccountForm />
				</div>
			</Container>
		</Layout>
	);
};

export default Account;
