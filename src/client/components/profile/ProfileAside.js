import React from "react";
import { IoPersonCircleSharp } from "react-icons/io5";
const ProfileAside = ({ name, handleLogOut, handleChangePage }) => {
	return (
		<div className="profile__container__aside">
			<div className="profile__container__aside__greeting">
				<IoPersonCircleSharp color="orange" size={64} />
				<h5 className="profile__container__aside__greeting__text">
					Hi, {name}
				</h5>
			</div>
			<div className="profile__container__aside__content">
				<ul className="profile__container__aside__content__nav">
					<li>
						<a
							href="/profile#/"
							onClick={() => handleChangePage("info")}
						>
							<div>Personal Info</div>
						</a>
					</li>

					<li>
						<a
							href="/profile#/setting"
							onClick={() => handleChangePage("setting")}
						>
							<div>Public Profile Setting</div>
						</a>
					</li>
					<li>
						<a
							href="/profile#/password"
							onClick={() => handleChangePage("password")}
						>
							<div>Change Password</div>
						</a>
					</li>
				</ul>
				<ul className="profile__container__aside__content__nav">
					<li>
						<a
							href="/profile#/recipes"
							onClick={() => handleChangePage("recipes")}
						>
							<div>All Personal Recipes</div>
						</a>
					</li>
					<li>
						<a
							href="/profile#/reviews"
							onClick={() => handleChangePage("reviews")}
						>
							<div>Recipes Reviews</div>
						</a>
					</li>
				</ul>
				<ul className="profile__container__aside__content__nav">
					<li>
						<a href="/" onClick={handleLogOut}>
							<div>Log out</div>
						</a>
					</li>
				</ul>
			</div>
			<div></div>
		</div>
	);
};

export default ProfileAside;
