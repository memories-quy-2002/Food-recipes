import React from "react";
import ChangePassword from "./ChangePassword";
import PersonalInfo from "./PersonalInfo";
import PersonalRecipes from "./PersonalRecipes";
import Reviews from "./Reviews";

const ProfileMain = ({ user, page, reviewsData }) => (
	<section className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6 lg:p-8">
		{page === "" && <PersonalInfo user={user} />}
		{page === "password" && <ChangePassword user={user} />}
		{page === "recipes" && <PersonalRecipes user={user} />}
		{page === "reviews" && <Reviews reviewsData={reviewsData} />}
	</section>
);
export default ProfileMain;
