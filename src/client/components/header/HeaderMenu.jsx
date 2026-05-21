import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const HeaderMenu = ({ items }) => {
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const isActive = (href) =>
		href === "/" ? pathname === href : pathname.startsWith(href);

	return (
		<div className="header__menu">
			{items.map(({ title, href }, index) => (
				<button
					key={index}
					type="button"
					className={`header__menu__content${
						isActive(href) ? " header__menu__content--active" : ""
					}`}
					onClick={() => navigate(href)}
				>
					{title}
				</button>
			))}
		</div>
	);
};

export default HeaderMenu;
