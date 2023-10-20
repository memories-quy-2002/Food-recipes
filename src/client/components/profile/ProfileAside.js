import React from "react";
import { useDispatch } from "react-redux";
import { authActions } from "../../redux/authSlice";

const ProfileAside = ({ name }) => {
	const dispatch = useDispatch();
	return (
		<div className="profile__container__aside">
			<div className="profile__container__aside__img">
				<img
					src={require("../../assets/images/avatar.png")}
					alt="Avatar"
					width={160}
				/>
			</div>
			<div className="profile__container__aside__content">
				<div className="profile__container__aside__content__title">
					<h4>{name}</h4>
				</div>
				<ul className="profile__container__aside__content__menu">
					<li>
						<a href="/">
							<div>Home</div>
						</a>
					</li>
					<li>
						<a href="/support">
							<div>Support</div>
						</a>
					</li>
					<li>
						<a href="/setting">
							<div>Setting</div>
						</a>
					</li>
					<li>
						<a
							href="/"
							onClick={() => dispatch(authActions.logout())}
						>
							<div>Sign out</div>
						</a>
					</li>
				</ul>
			</div>
			<div></div>
		</div>
	);
};

export default ProfileAside;
