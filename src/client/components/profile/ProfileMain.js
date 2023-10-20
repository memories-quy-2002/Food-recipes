import React from "react";

const ProfileMain = ({ user }) => {
	return (
		<div className="profile__container__main">
			<h2>About</h2>
			<ul className="profile__container__main__about">
				<li>
					<strong>Full name</strong> <p>{user.full_name}</p>
				</li>
				<li>
					<strong>Email</strong> <p>{user.email}</p>
				</li>
				<li>
					<strong>Phone</strong>{" "}
					<p>{user.phone ? user.phone : "Not provided"}</p>
				</li>
				<li>
					<strong>Address</strong>{" "}
					<p>{user.address ? user.address : "Not provided"}</p>
				</li>
			</ul>
		</div>
	);
};

export default ProfileMain;
