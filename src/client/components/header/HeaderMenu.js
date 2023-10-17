import React, { useEffect } from "react";
import HeaderButton from "./HeaderButton";
import { BsFillPersonFill } from "react-icons/bs";
import axios from "../../api/axios";
const HeaderMenu = ({ items }) => {
	const token = localStorage.getItem("jwt");
	(async () => {
		const response = await axios.post(
			"http://localhost:4000/account",
			JSON.stringify({ token }),
			{
				headers: { "Content-Type": "application/json" },
				withCredentials: true,
			}
		);
		if (response.status === 200) {
			console.log(0);
		}
	})();
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
			{localStorage.getItem("jwt") !== null ? (
				<HeaderButton
					title="Sign up"
					icon={<BsFillPersonFill />}
					href="/account"
				/>
			) : null}
		</div>
	);
};

export default HeaderMenu;
