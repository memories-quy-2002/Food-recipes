import type { PropsWithChildren, ReactElement } from "react";
import Header from "./Header";
import Footer from "./Footer";

const Layout = ({ children }: PropsWithChildren): ReactElement => (
	<div>
		<Header />
		{children}
		<Footer />
	</div>
);

export default Layout;
