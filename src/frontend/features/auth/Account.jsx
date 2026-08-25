import React from "react";
import AccountForm from "@/features/auth/components/AccountForm";
import PageHelmet from "@/shared/seo/PageHelmet";

const Account = () => {
	return (
		<main className="fr-page min-h-[calc(100vh-5rem)] w-full bg-[radial-gradient(circle_at_top_left,rgba(255,159,28,0.18),transparent_32%),linear-gradient(135deg,#18110c_0%,#4b2e1e_50%,#211813_100%)] px-3 py-5 sm:px-6 sm:py-8 lg:px-10 lg:py-12">
			<PageHelmet
				title="Account"
				description="Log in or create a Food Recipes account to save favorites, rate recipes, and manage your profile."
				path="/account"
				noIndex
			/>
			<div className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-6xl items-center justify-center">
				<AccountForm />
			</div>
		</main>
	);
};

export default Account;
