import React from "react";
import NavBar from "./NavBar";
import Header from "./Header";
import Footer from "./Footer";

const Layout = ({ children }) => {
	return (
		<div>
			<Header />
			<NavBar />
			{children}
			<Footer />
		</div>
	);
};

export default Layout;
