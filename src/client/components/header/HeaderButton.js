import React from "react";
import { Button } from "react-bootstrap";

const HeaderButton = ({ title, href }) => {
	return (
		<Button className="header__menu__content" href={href}>
			{title}
		</Button>
	);
};

export default HeaderButton;
