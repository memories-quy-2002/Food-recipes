import React from "react";
import Layout from "../components/layout/Layout";
import { Container } from "react-bootstrap";
import "../styles/Profile.scss";
import ProfileAside from "../components/profile/ProfileAside";
import ProfileMain from "../components/profile/ProfileMain";
import { useDispatch, useSelector } from "react-redux";
import { authActions } from "../redux/authSlice";

const Profile = () => {
	const user = useSelector((state) => state.auth.user);
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
