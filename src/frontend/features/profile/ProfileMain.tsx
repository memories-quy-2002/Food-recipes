import { useEffect, useRef, type ReactElement } from "react";
import ChangePassword from "./ChangePassword";
import PersonalInfo from "./PersonalInfo";
import PersonalRecipes from "./PersonalRecipes";
import ProfileOverview from "./ProfileOverview";
import Reviews from "./Reviews";
import type { ProfilePage, ProfileUser } from "./profileTypes";

type ProfileMainProps = {
	user: ProfileUser | null | undefined;
	page: ProfilePage;
};

const ProfileMain = ({ user, page }: ProfileMainProps): ReactElement => {
	const contentRef = useRef<HTMLElement>(null);
	const isInitialRender = useRef(true);

	useEffect(() => {
		if (isInitialRender.current) {
			isInitialRender.current = false;
			return;
		}
		contentRef.current?.focus({ preventScroll: true });
	}, [page]);

	return (
		<section ref={contentRef} tabIndex={-1} aria-label="Profile content" className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:p-6 lg:p-8">
			{page === "overview" && <ProfileOverview user={user} />}
			{page === "personal-info" && <PersonalInfo user={user} />}
			{page === "password" && <ChangePassword />}
			{page === "recipes" && <PersonalRecipes user={user} />}
			{page === "reviews" && <Reviews />}
		</section>
	);
};
export default ProfileMain;
