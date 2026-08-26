import { Suspense, lazy, useEffect, useState, type ReactElement } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { isAxiosError } from "axios";
import ProfileAside from "@/features/profile/ProfileAside";
import PageHelmet from "@/shared/seo/PageHelmet";
import PageState from "@/shared/ui/PageState";
import { authActions } from "@/features/auth/state/authSlice";
import { authSessionApi } from "@/features/auth/api/authSessionApi";
import axios from "@/shared/api/axios";
import { getArrayPayload } from "@/shared/api/payload";
import { apiRoutes } from "@/shared/api/routes";
import { useToast } from "@/app/ToastProvider";
import type { RootState } from "@/app/store";
import { isProfileRating, type ProfilePage, type ProfileRating } from "./profileTypes";

const ProfileMain = lazy(() => import("@/features/profile/ProfileMain"));
const profilePageList: Array<{ link: ProfilePage; name: string }> = [
	{ link: "", name: "Personal info" },
	{ link: "password", name: "Change password" },
	{ link: "recipes", name: "My recipes" },
	{ link: "reviews", name: "My reviews" },
];
const getProfilePageFromHash = (hash = ""): ProfilePage => {
	const page = hash.replace(/^#\/?/, "");
	return page === "password" || page === "recipes" || page === "reviews" ? page : "";
};

const getApiErrorMessage = (error: unknown, fallback: string): string => {
	if (!isAxiosError(error)) return fallback;
	const data = error.response?.data;
	return typeof data === "object" && data !== null && "message" in data && typeof data.message === "string" ? data.message : fallback;
};

const Profile = (): ReactElement => {
	const user = useSelector((state: RootState) => state.auth.local.user ?? state.auth.session.user);
	const location = useLocation();
	const [page, setPage] = useState(() => getProfilePageFromHash(window.location.hash));
	const dispatch = useDispatch();
	const [ratings, setRatings] = useState<ProfileRating[]>([]);
	const [isLoadingRatings, setIsLoadingRatings] = useState(true);
	const [ratingsError, setRatingsError] = useState<string | null>(null);
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
	useEffect(() => {
		const fetchReviews = async (): Promise<void> => {
			if (!user?.user_id) { setIsLoadingRatings(false); return; }
			try {
				setIsLoadingRatings(true);
				setRatingsError(null);
				const response = await axios.get<unknown>(apiRoutes.userRatings);
				setRatings(getArrayPayload(response.data, "ratings", isProfileRating));
			} catch (err: unknown) {
				console.error(err);
				setRatingsError(getApiErrorMessage(err, "Unable to load your profile reviews."));
			} finally { setIsLoadingRatings(false); }
		};
		fetchReviews();
		return undefined;
	}, [user]);

	return (
		<div className="min-h-screen bg-background">
			<PageHelmet title="Profile" description="Manage your Food Recipes profile, password, personal recipes, and reviews." path="/profile" noIndex />
			<main className="mx-auto grid w-full max-w-[96rem] gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-7 lg:px-8 lg:py-10">
				<ProfileAside name={user?.full_name} page={page} handleLogOut={handleLogOut} handleChangePage={setPage} profilePageList={profilePageList} />
				<Suspense fallback={<PageState title="Loading profile" message="Preparing your account tools." />}>
					{page === "reviews" && isLoadingRatings ? (
						<PageState title="Loading reviews" message="Fetching your recipe reviews." />
					) : page === "reviews" && ratingsError ? (
						<PageState type="error" title="Reviews could not load" message={ratingsError} />
					) : (
						<ProfileMain user={user} page={page} reviewsData={ratings} />
					)}
				</Suspense>
			</main>
		</div>
	);
};
export default Profile;
