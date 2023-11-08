import React from "react";
import { Container } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import Layout from "../components/layout/Layout";
import ProfileAside from "../components/profile/ProfileAside";
import ProfileMain from "../components/profile/ProfileMain";
import { authActions } from "../redux/authSlice";
import "../styles/Profile.scss";

const Profile = () => {
	const user = useSelector((state) =>
		state.auth.local.user ? state.auth.local.user : state.auth.session.user
	);
	const dispatch = useDispatch();
	const handleLogOut = () => {
		dispatch(authActions.logout());
	};
	return (
		<Layout>
			<Container fluid style={{ padding: 0 }}>
				<div className="profile__container">
					<ProfileAside
						name={user.full_name}
						handleLogOut={handleLogOut}
					/>
					<ProfileMain user={user} />
				</div>
			</Container>
		</Layout>
	);
};

export default Profile;
