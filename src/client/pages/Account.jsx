import React from "react";
import { Container } from "react-bootstrap";
import AccountForm from "../components/account/AccountForm";
import PageHelmet from "../components/seo/PageHelmet";
import "../styles/Account.scss";
const Account = () => {
	return (
		<Container fluid className="main">
			<PageHelmet
				title="Account"
				description="Log in or create a Food Recipes account to save favorites, rate recipes, and manage your profile."
				path="/account"
				noIndex
			/>
			<div className="blur">
				<AccountForm />
			</div>
		</Container>
	);
};

export default Account;
