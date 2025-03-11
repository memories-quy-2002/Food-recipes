import React from "react";
import { Navbar } from "react-bootstrap";
import hamburger from "../../assets/icons/hamburger.svg";

const HeaderBrand = () => {
	return (
		<div className="header__brand">
			<Navbar.Brand href="/" className="d-flex gap-2 align-items-center">
				<img src={hamburger} alt="Icon" width={35} />
				<p className="m-0">Food Recipes</p>
			</Navbar.Brand>
		</div>
	);
};

export default HeaderBrand;
