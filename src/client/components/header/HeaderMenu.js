import React from "react";
import HeaderButton from "./HeaderButton";

const HeaderMenu = ({ items }) => {
	return (
		<div className="header__menu">
			{items.map(({ title, icon, href }, index) => (
				<HeaderButton
					key={index}
					title={title}
					icon={icon}
					href={href}
				/>
			))}
		</div>
	);
};

export default HeaderMenu;
