import React from "react";
import { useNavigate } from "react-router-dom";

const HeaderMenu = ({ items }) => {
	const navigate = useNavigate();

	return (
		<div className="header__menu">
			{items.map(({ title, href }, index) => (
				<button
					key={index}
					className="header__menu__content"
					onClick={() => navigate(href)}
				>
					{title}
				</button>
			))}
		</div>
	);
};

export default HeaderMenu;
