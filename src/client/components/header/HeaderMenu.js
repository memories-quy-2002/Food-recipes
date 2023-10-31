import React, { useEffect, useState } from "react";
import { BsFillPersonFill } from "react-icons/bs";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import { authActions } from "../../redux/authSlice";
import HeaderButton from "./HeaderButton";

const HeaderMenu = ({ items, auth }) => {
	const { local, session } = auth;
	const { token } = local;
	const [user, setUser] = useState({});
	const isAuthenticated = local.isAuthenticated || session.isAuthenticated;
	const dispatch = useDispatch();
	const navigate = useNavigate();

	useEffect(() => {
		const fetchData = async () => {
			if (token) {
				try {
					const response = await axios.post("/account/jwt", {
						token,
					});
					console.log("Hello");

					setUser(response.data.user);
				} catch (error) {
					if (error.response && error.response.status === 401) {
						dispatch(authActions.logout());
					}
				}
			} else {
				setUser(session.user);
			}
		};

		fetchData();
	}, [token, session.user, dispatch]);
	const handleSignOut = () => {
		dispatch(authActions.logout());
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
			{isAuthenticated ? (
				<div className="header__menu__dropdown">
					<button className="header__menu__dropdown__button">
						{user ? user.full_name : ""}
					</button>
					<div className="header__menu__dropdown__content">
						<a href="/profile">Profile</a>
						<a href="/setting">Settings</a>
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
