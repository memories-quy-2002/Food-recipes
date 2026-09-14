import type { PropsWithChildren, ReactElement } from "react";
import EmailVerificationReminder from "@/features/auth/components/EmailVerificationReminder";
import Header from "./Header";
import Footer from "./Footer";

const Layout = ({ children }: PropsWithChildren): ReactElement => (
	<div>
		<Header />
		<EmailVerificationReminder />
		{children}
		<Footer />
	</div>
);

export default Layout;
