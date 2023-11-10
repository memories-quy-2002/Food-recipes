import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import { authActions } from "../../redux/authSlice";
const HeaderAuthButton = ({ auth }) => {
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
	};
	const handleClick = () => {
		navigate("/account");
	};
	return (
		<div className="header__auth">
			{isAuthenticated ? (
				<div className="header__auth--login">
					<button className="header__auth--login__button">
						<p className="m-0">
							{user ? user.full_name : "Unknown"}
						</p>
					</button>
					<div className="header__auth--login__content">
						<a href="/profile">Profile</a>
						<a href="/" onClick={handleSignOut}>
							Sign out
						</a>
					</div>
				</div>
			) : (
				<div className="header__auth--signup">
					<button
						type="button"
						onClick={handleClick}
						className="header__auth--signup__button"
					>
						Sign up
					</button>
				</div>
			)}
		</div>
	);
};

export default HeaderAuthButton;
