import React from "react";
import { Button, Navbar } from "react-bootstrap";
import {
	BsFillBoxFill,
	BsSearch,
	BsCartFill,
	BsFillPersonFill,
	BsBoxArrowRight,
} from "react-icons/bs";
import "../../styles/Header.scss";

const Header = () => {
	return (
		<header className="container header">
			<Navbar.Brand
				href="/"
				className="d-flex align-items-center gap-2 header__brand"
			>
				<BsFillBoxFill />
				React
			</Navbar.Brand>
			<div className="header__search">
				<input
					type="text"
					placeholder="Search..."
					className="header__search__bar"
				/>
				<button className="header__search__icon">
					<BsSearch />
				</button>
			</div>
			<div className="header__button">
				<Button className="header__button--cart">
					<BsCartFill />
					My cart
				</Button>
				<Button className="header__button--signup">
					<BsFillPersonFill /> Sign up
				</Button>
				<Button className="header__button--login">
					<BsBoxArrowRight />
					Log in
				</Button>
			</div>
		</header>
	);
};

export default Header;
