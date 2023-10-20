import React from "react";
import Layout from "../components/layout/Layout";
import { Container } from "react-bootstrap";
import "../styles/Profile.scss";
import ProfileAside from "../components/profile/ProfileAside";
import ProfileMain from "../components/profile/ProfileMain";
import { useSelector } from "react-redux";

const Profile = () => {
	const user = useSelector((state) => state.auth.user);
	return (
		<Layout>
			<Container fluid style={{ padding: 0 }}>
				<div className="profile__container">
					<ProfileAside name={user.full_name} />
					<ProfileMain user={user} />
				</div>
			</Container>
		</Layout>
	);
};

export default Profile;
