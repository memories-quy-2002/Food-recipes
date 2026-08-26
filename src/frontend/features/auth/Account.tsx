import AccountForm from "@/features/auth/components/AccountForm";
import PageHelmet from "@/shared/seo/PageHelmet";
import type { ReactElement } from "react";

const Account = (): ReactElement => {
	return (
		<main className="fr-page min-h-[calc(100vh-5rem)] w-full bg-background px-3 py-5 text-foreground sm:px-6 sm:py-8 lg:px-10 lg:py-12">
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
