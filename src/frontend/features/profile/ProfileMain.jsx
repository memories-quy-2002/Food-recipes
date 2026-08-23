import React from "react";
import ChangePassword from "./ChangePassword";
import PersonalInfo from "./PersonalInfo";
import PersonalRecipes from "./PersonalRecipes";
import Reviews from "./Reviews";
const ProfileMain = ({ user, page, reviewsData }) => {
	return (
		<section className="profile__container__main">
			{page === "" && <PersonalInfo user={user} />}
			{page === "password" && <ChangePassword user={user} />}
			{page === "recipes" && <PersonalRecipes user={user} />}
			{page === "reviews" && <Reviews reviewsData={reviewsData} />}
		</section>
	);
};

export default ProfileMain;
