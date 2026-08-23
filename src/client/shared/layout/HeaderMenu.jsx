import React from "react";
import { Link, useLocation } from "react-router-dom";
import { isNavigationItemActive } from "./navigation";

const HeaderMenu = ({ items }) => {
	const { pathname } = useLocation();

	return (
		<nav className="header__menu" aria-label="Primary navigation">
			{items.map(({ title, href }, index) => (
				<Link
					key={index}
					className={`header__menu__content${
						isNavigationItemActive(pathname, href, items)
							? " header__menu__content--active"
							: ""
					}`}
					aria-current={
						isNavigationItemActive(pathname, href, items)
							? "page"
							: undefined
					}
					to={href}
				>
					{title}
				</Link>
			))}
		</nav>
	);
};

export default HeaderMenu;
