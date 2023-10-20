import React, { useState } from "react";
import { BsCartFill, BsHeartFill, BsHouseFill } from "react-icons/bs";
import { FaUtensils } from "react-icons/fa6";
import "../../styles/Header.scss";
import HeaderBrand from "../header/HeaderBrand";
import HeaderMenu from "../header/HeaderMenu";
import HeaderToggle from "../header/HeaderToggle";
const items = [
	{
		title: "Home",
		icon: <BsHouseFill />,
		href: "/",
	},
	{
		title: "Food",
		icon: <FaUtensils />,
		href: "/food",
	},
	{
		title: "Wishlist",
		icon: <BsHeartFill />,
		href: "/wishlist",
	},
	{
		title: "Cart",
		icon: <BsCartFill />,
		href: "/cart",
	},
];
const Header = () => {
	const [show, setShow] = useState(false);

	const handleClose = () => setShow(false);
	const handleShow = () => setShow(true);
	return (
		<header className="container-fluid header">
			<HeaderBrand />
			<HeaderMenu items={items} />
			<HeaderToggle
				show={show}
				handleClose={handleClose}
				handleShow={handleShow}
				items={items}
			/>
		</header>
	);
};

export default Header;
