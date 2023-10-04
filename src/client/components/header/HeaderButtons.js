import React from "react";
import { Button } from "react-bootstrap";
import {
	BsBoxArrowRight,
	BsCartFill,
	BsFillPersonFill,
	BsHeartFill,
} from "react-icons/bs";

const HeaderButtons = () => {
	return (
		<div className="header__button">
			<Button className="header__button--cart" href="/">
				<BsCartFill />
				My cart
			</Button>
			<Button className="header__button--wishlist" href="/wishlist">
				<BsHeartFill />
				Wish list
			</Button>
			<Button className="header__button--signup" href="/signup">
				<BsFillPersonFill /> Sign up
			</Button>
			<Button className="header__button--login" href="/login">
				<BsBoxArrowRight />
				Log in
			</Button>
		</div>
	);
};

export default HeaderButtons;
