import type { ReactElement } from "react";
import ChangePassword from "./ChangePassword";
import PersonalInfo from "./PersonalInfo";
import PersonalRecipes from "./PersonalRecipes";
import Reviews from "./Reviews";
import type { ProfilePage, ProfileRating, ProfileUser } from "./profileTypes";

type ProfileMainProps = {
	user: ProfileUser | null | undefined;
	page: ProfilePage;
	reviewsData: ProfileRating[];
};

const ProfileMain = ({ user, page, reviewsData }: ProfileMainProps): ReactElement => (
	<section className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6 lg:p-8">
		{page === "" && <PersonalInfo user={user} />}
		{page === "password" && <ChangePassword />}
		{page === "recipes" && <PersonalRecipes user={user} />}
		{page === "reviews" && <Reviews reviewsData={reviewsData} />}
	</section>
);
export default ProfileMain;
