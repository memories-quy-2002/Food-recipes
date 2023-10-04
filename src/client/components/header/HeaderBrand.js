import React from "react";
import { Navbar } from "react-bootstrap";
import hamburger from "../../assets/icons/hamburger.svg";

const HeaderBrand = () => {
	return (
		<Navbar.Brand
			href="/"
			className="d-flex align-items-center gap-2 header__brand"
		>
			<img src={hamburger} alt="Icon" width={35} />
			Food Recipe
		</Navbar.Brand>
	);
};

export default HeaderBrand;
