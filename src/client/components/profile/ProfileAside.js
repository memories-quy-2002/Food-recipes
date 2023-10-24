import React from "react";
import convertImage from "../../utils/convertImage";

const ProfileAside = ({ name, handleLogOut }) => {
	return (
		<div className="profile__container__aside">
			<div className="profile__container__aside__img">
				{convertImage("avatar", "")}
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
						<a href="/" onClick={handleLogOut}>
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
