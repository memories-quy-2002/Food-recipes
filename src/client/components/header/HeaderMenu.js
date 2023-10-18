import React, { useEffect, useState } from "react";
import { Dropdown } from "react-bootstrap";
import { BsFillPersonFill } from "react-icons/bs";
import axios from "../../api/axios";
import HeaderButton from "./HeaderButton";
import { useNavigate } from "react-router-dom";
const HeaderMenu = ({ items }) => {
	const token = localStorage.getItem("jwt");
	const [name, setName] = useState("");
	const navigate = useNavigate();
	useEffect(() => {
		const getName = async (token) => {
			const response = await axios.post(
				"http://localhost:4000/account",
				JSON.stringify({ token }),
				{
					headers: { "Content-Type": "application/json" },
					withCredentials: true,
				}
			);
			setName(response.data.user.full_name);
		};
		getName(token);
	});
	const handleSignOut = () => {
		localStorage.removeItem("jwt");
		navigate("/");
	};
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
			{token !== null ? (
				<div className="header__menu__dropdown">
					<button className="header__menu__dropdown__button">
						{name}
					</button>
					<div className="header__menu__dropdown__content">
						<a href="/profile">Profile</a>
						<a href="#/action-2">Settings</a>
						<a href="/" onClick={handleSignOut}>
							Sign out
						</a>
					</div>
				</div>
			) : (
				<HeaderButton
					title="Sign up"
					icon={<BsFillPersonFill />}
					href="/account"
				/>
			)}
		</div>
	);
};

export default HeaderMenu;
