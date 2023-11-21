import React from "react";
import ChangePassword from "./ChangePassword";
import PersonalInfo from "./PersonalInfo";
import PersonalRecipes from "./PersonalRecipes";
import Reviews from "./Reviews";
const ProfileMain = ({ user, page, reviewsData }) => {
	return (
		<section className="profile__container__main">
			{page === "info" && <PersonalInfo user={user} />}
			{/* {page === "setting" && <PersonalInfo />} */}
			{page === "password" && <ChangePassword user={user} />}
			{page === "recipes" && <PersonalRecipes />}
			{page === "reviews" && <Reviews reviewsData={reviewsData} />}
		</section>
	);
};

export default ProfileMain;
