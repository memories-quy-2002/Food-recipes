import React from "react";
import { Button } from "react-bootstrap";

const HeaderButton = ({ icon, title, href }) => {
	return (
		<Button className="header__menu--content" href={href}>
			{icon}
			{title}
		</Button>
	);
};

export default HeaderButton;
