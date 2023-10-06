import React from "react";
import {
	BsCartFill,
	BsFillPersonFill,
	BsHeartFill,
	BsHouseFill,
} from "react-icons/bs";
import { IoFastFood } from "react-icons/io5";
import HeaderButton from "./HeaderButton";

const HeaderMenu = () => {
	return (
		<div className="header__menu">
			<HeaderButton icon={<BsHouseFill />} title="Home" href="/" />
			<HeaderButton icon={<IoFastFood />} title="Food" href="/food" />
			<HeaderButton
				icon={<BsHeartFill />}
				title="Wish list"
				href="/wishlist"
			/>
			<HeaderButton icon={<BsCartFill />} title="My cart" href="/cart" />

			<HeaderButton
				icon={<BsFillPersonFill />}
				title="Sign up"
				href="/account"
			/>
		</div>
	);
};

export default HeaderMenu;
