import React, { useState } from "react";
import "../../styles/Header.scss";
import HeaderBrand from "../header/HeaderBrand";
import HeaderMenu from "../header/HeaderMenu";
import HeaderToggle from "../header/HeaderToggle";

const Header = () => {
	const [show, setShow] = useState(false);

	const handleClose = () => setShow(false);
	const handleShow = () => setShow(true);
	return (
		<header className="container-fluid header">
			<HeaderBrand />
			<HeaderMenu />
			<HeaderToggle
				show={show}
				handleClose={handleClose}
				handleShow={handleShow}
			/>
		</header>
	);
};

export default Header;
