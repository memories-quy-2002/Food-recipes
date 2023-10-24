import React from "react";

const ProfileMain = ({ user }) => {
	const { full_name, email, phone, address } = user;
	return (
		<div className="profile__container__main">
			<h2>About</h2>
			<ul className="profile__container__main__about">
				<li>
					<strong>Full name</strong> <p>{full_name}</p>
				</li>
				<li>
					<strong>Email</strong> <p>{email}</p>
				</li>
				<li>
					<strong>Phone</strong> <p>{phone || "Not provided"}</p>
				</li>
				<li>
					<strong>Address</strong> <p>{address || "Not provided"}</p>
				</li>
			</ul>
		</div>
	);
};

export default ProfileMain;
