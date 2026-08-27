import { Suspense, lazy, useEffect, useState, type ReactElement } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import ProfileAside from "@/features/profile/ProfileAside";
import PageHelmet from "@/shared/seo/PageHelmet";
import PageState from "@/shared/ui/PageState";
import { authActions } from "@/features/auth/state/authSlice";
import { authSessionApi } from "@/features/auth/api/authSessionApi";
import { useToast } from "@/app/ToastProvider";
import type { RootState } from "@/app/store";
import type { ProfilePage } from "./profileTypes";

const ProfileMain = lazy(() => import("@/features/profile/ProfileMain"));

export const getProfilePageFromHash = (hash = ""): ProfilePage => {
	if (!hash) return "overview";
	const page = hash.replace(/^#\/?/, "");
	if (page === "") return "personal-info";
	return page === "personal-info" || page === "password" || page === "recipes" || page === "reviews" ? page : "overview";
};

const Profile = (): ReactElement => {
	const user = useSelector((state: RootState) => state.auth.local.user ?? state.auth.session.user);
	const location = useLocation();
	const [page, setPage] = useState(() => getProfilePageFromHash(window.location.hash));
	const dispatch = useDispatch();
	const { showToast } = useToast();
	const handleLogOut = async (): Promise<void> => {
		try {
			await authSessionApi.logout();
		} catch (error: unknown) {
			// Local auth must still clear when the server is unavailable.
			console.error(error);
		} finally {
			dispatch(authActions.logout());
			showToast({ title: "Signed out" });
		}
	};

	useEffect(() => setPage(getProfilePageFromHash(location.hash)), [location.hash]);

	return (
		<div className="min-h-screen bg-background">
			<PageHelmet title="Profile" description="Manage your Food Recipes profile, password, personal recipes, and reviews." path="/profile" noIndex />
			<main className="mx-auto grid w-full max-w-[96rem] gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-7 lg:px-8 lg:py-10">
				<ProfileAside name={user?.full_name} page={page} handleLogOut={handleLogOut} handleChangePage={setPage} />
				<Suspense fallback={<PageState title="Loading profile" message="Preparing your account tools." />}>
					<ProfileMain user={user} page={page} />
				</Suspense>
			</main>
		</div>
	);
};
export default Profile;
