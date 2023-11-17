import React from "react";
import ChangePassword from "./ChangePassword";
import PersonalInfo from "./PersonalInfo";
import PersonalRecipes from "./PersonalRecipes";
import Reviews from "./Reviews";
const ProfileMain = ({ user, page }) => {
	return (
		<section className="profile__container__main">
			{page === "info" && <PersonalInfo user={user} />}
			{page === "setting" && <PersonalInfo />}
			{page === "password" && <ChangePassword />}
			{page === "recipes" && <PersonalRecipes />}
			{page === "reviews" && <Reviews />}
		</section>
	);
};

export default ProfileMain;
