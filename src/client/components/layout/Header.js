import React, { useState } from "react";
import { useSelector } from "react-redux";
import "../../styles/Header.scss";
import HeaderAuthButton from "../header/HeaderAuthButton";
import HeaderBrand from "../header/HeaderBrand";
import HeaderMenu from "../header/HeaderMenu";
import HeaderToggle from "../header/HeaderToggle";
const items = [
	{
		title: "Home",
		href: "/",
	},
	{
		title: "Food",
		href: "/food",
	},
	{
		title: "Wishlist",
		href: "/wishlist",
	},
];
const Header = () => {
	const [show, setShow] = useState(false);
	const auth = useSelector((state) => state.auth);
	const handleClose = () => setShow(false);
	const handleShow = () => setShow(true);
	return (
		<header className="container-fluid header">
			<div className="header__main">
				<HeaderBrand />
				<HeaderMenu items={items} />
				<HeaderAuthButton auth={auth} />
				<HeaderToggle
					show={show}
					handleClose={handleClose}
					handleShow={handleShow}
					items={items}
					auth={auth}
				/>
			</div>
		</header>
	);
};

export default Header;
