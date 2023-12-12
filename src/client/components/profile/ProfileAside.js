import React from "react";
import { IoPersonCircleSharp } from "react-icons/io5";
const ProfileAside = ({
	name,
	handleLogOut,
	handleChangePage,
	profilePageList,
}) => {
	return (
		<div className="profile__container__aside">
			<div className="profile__container__aside__greeting">
				<IoPersonCircleSharp color="orange" size={64} />
				<h5 className="profile__container__aside__greeting__text">
					Hi, {name}
				</h5>
			</div>
			<div className="profile__container__aside__content">
				<ul className="profile__container__aside__content__nav">
					{profilePageList.map(({ link, name }, index) => (
						<li key={index}>
							<a
								href={`/profile#/${link}`}
								onClick={() => handleChangePage(link)}
							>
								<div>
									<span>{name}</span>
								</div>
							</a>
						</li>
					))}
				</ul>

				<ul
					className="profile__container__aside__content__nav"
					style={{ borderBottom: "none" }}
				>
					<li>
						<a href="/" onClick={handleLogOut}>
							<div>Log out</div>
						</a>
					</li>
				</ul>
			</div>
			<div></div>
		</div>
	);
};

export default ProfileAside;
