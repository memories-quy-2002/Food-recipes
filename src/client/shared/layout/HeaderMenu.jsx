import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const HeaderMenu = ({ items }) => {
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const isActive = (href) =>
		href === "/" ? pathname === href : pathname.startsWith(href);

	return (
		<nav className="header__menu" aria-label="Primary navigation">
			{items.map(({ title, href }, index) => (
				<button
					key={index}
					type="button"
					className={`header__menu__content${
						isActive(href) ? " header__menu__content--active" : ""
					}`}
					aria-current={isActive(href) ? "page" : undefined}
					onClick={() => navigate(href)}
				>
					{title}
				</button>
			))}
		</nav>
	);
};

export default HeaderMenu;
