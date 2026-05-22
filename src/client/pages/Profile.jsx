import React, { Suspense, lazy, useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import ProfileAside from "../components/profile/ProfileAside";
import PageHelmet from "../components/seo/PageHelmet";
import PageState from "../components/ui/PageState";
import { authActions } from "../redux/authSlice";
import "../styles/Profile.scss";
import axios from "../api/axios";
import { getArrayPayload } from "../api/payload";
import { CancelToken } from "axios";
const ProfileMain = lazy(() => import("../components/profile/ProfileMain"));
const profilePageList = [
	{
		link: "",
		name: "Personal info",
	},
	{
		link: "password",
		name: "Change password",
	},
	{
		link: "recipes",
		name: "All Personal Recipes",
	},
	{
		link: "reviews",
		name: "Recipes Reviews",
	},
];
const Profile = () => {
	const user = useSelector(
		(state) => state.auth.local.user ?? state.auth.session.user
	);
	const [page, setPage] = useState(
		window.location.hash.replace("#/", "") || ""
	);
	const dispatch = useDispatch();

	const handleLogOut = () => {
		dispatch(authActions.logout());
	};
	const handleChangePage = (pageName) => {
		setPage(pageName);
	};

	const [ratings, setRatings] = useState([]);
	const [isLoadingRatings, setIsLoadingRatings] = useState(true);
	const [ratingsError, setRatingsError] = useState(null);

	useEffect(() => {
		const fetchReviews = async () => {
			if (!user?.user_id) {
				setIsLoadingRatings(false);
				return;
			}

			try {
				setIsLoadingRatings(true);
				setRatingsError(null);
				const response = await axios.get(`/rating/${user.user_id}`);
				setRatings(getArrayPayload(response.data, "ratings"));
			} catch (err) {
				console.error(err);
				setRatingsError(
					err.response?.data?.message ||
						"Unable to load your profile reviews."
				);
			} finally {
				setIsLoadingRatings(false);
			}
		};

		const source = CancelToken.source();

		fetchReviews();

		return () => {
			source.cancel("Component unmounted, canceling request");
		};
	}, [user]);

	// Rest of your component...

	return (
		<Container fluid style={{ padding: 0 }}>
			<PageHelmet
				title="Profile"
				description="Manage your Food Recipes profile, password, personal recipes, and reviews."
				path="/profile"
				noIndex
			/>
			<main className="profile__container">
				<ProfileAside
					name={user?.full_name}
					page={page}
					handleLogOut={handleLogOut}
					handleChangePage={handleChangePage}
					profilePageList={profilePageList}
				/>
				<Suspense
					fallback={
						<PageState
							title="Loading profile"
							message="Preparing your account tools."
						/>
					}
				>
					{page === "reviews" && isLoadingRatings ? (
						<PageState
							title="Loading reviews"
							message="Fetching your recipe reviews."
						/>
					) : page === "reviews" && ratingsError ? (
						<PageState
							type="error"
							title="Reviews could not load"
							message={ratingsError}
						/>
					) : (
						<ProfileMain
							user={user}
							page={page}
							reviewsData={ratings}
						/>
					)}
				</Suspense>
			</main>
		</Container>
	);
};

export default Profile;
