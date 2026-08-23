import React, { useState } from "react";
import { useSelector } from "react-redux";
import "./Header.scss";
import HeaderAuthButton from "./HeaderAuthButton";
import HeaderBrand from "./HeaderBrand";
import HeaderMenu from "./HeaderMenu";
import HeaderToggle from "./HeaderToggle";
import { getPrimaryNavigation } from "./navigation";
const Header = () => {
	const [show, setShow] = useState(false);
	const auth = useSelector((state) => state.auth);
	const isAuthenticated =
		auth.local?.isAuthenticated || auth.session?.isAuthenticated;
	const items = getPrimaryNavigation(isAuthenticated);
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
