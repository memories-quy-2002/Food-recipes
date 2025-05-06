import React, { Suspense, lazy, useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import ProfileAside from "../components/profile/ProfileAside";
import { authActions } from "../redux/authSlice";
import "../styles/Profile.scss";
import axios from "../api/axios";
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
	const [page, setPage] = useState("");
	const dispatch = useDispatch();

	const handleLogOut = () => {
		dispatch(authActions.logout());
	};
	const handleChangePage = (pageName) => {
		setPage(pageName);
	};

	const [ratings, setRatings] = useState([]);

	useEffect(() => {
		const fetchReviews = async () => {
			try {
				const response = await axios.get(`rating/${user?.user_id}`);
				setRatings(response.data.ratings);
			} catch (err) {
				console.error(err);
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
			<main className="profile__container">
				<ProfileAside
					name={user?.full_name}
					handleLogOut={handleLogOut}
					handleChangePage={handleChangePage}
					profilePageList={profilePageList}
				/>
				<Suspense
					fallback={
						<div className="profile__container__main">
							Loading...
						</div>
					}
				>
					<ProfileMain
						user={user}
						page={page}
						reviewsData={ratings}
					/>
				</Suspense>
			</main>
		</Container>
	);
};

export default Profile;
