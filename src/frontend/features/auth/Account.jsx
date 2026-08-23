import React from "react";
import { Container } from "react-bootstrap";
import AccountForm from "@/features/auth/components/AccountForm";
import PageHelmet from "@/shared/seo/PageHelmet";
import "./Account.scss";
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
