import React, { useEffect } from "react";
import { BsFillPersonFill } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { authActions } from "../../redux/authSlice";
import HeaderButton from "./HeaderButton";
import axios from "../../api/axios";

const HeaderMenu = ({ items }) => {
	const { isAuthenticated, user, token } = useSelector((state) => state.auth);
	const dispatch = useDispatch();
	const navigate = useNavigate();
	useEffect(() => {
		const postToken = async () => {
			await axios.post("http://localhost:4000/account/jwt", { token });
		};
		postToken(token);
	}, [token]);

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
						{user.full_name}
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
