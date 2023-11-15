import React, { Suspense, lazy } from "react";
import { Container } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import ProfileAside from "../components/profile/ProfileAside";
import { authActions } from "../redux/authSlice";
import "../styles/Profile.scss";
const ProfileMain = lazy(() => import("../components/profile/ProfileMain"));

const Profile = () => {
	const user = useSelector((state) =>
		state.auth.local.user ? state.auth.local.user : state.auth.session.user
	);
	const dispatch = useDispatch();
	const handleLogOut = () => {
		dispatch(authActions.logout());
	};
	return (
		<Container fluid style={{ padding: 0 }}>
			<div className="profile__container">
				<ProfileAside
					name={user.full_name}
					handleLogOut={handleLogOut}
				/>
				<Suspense
					fallback={
						<div className="profile__container__main">
							Loading...
						</div>
					}
				>
					<ProfileMain user={user} />
				</Suspense>
			</div>
		</Container>
	);
};

export default Profile;
