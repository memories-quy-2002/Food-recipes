import React from "react";
import { IoPersonCircleSharp } from "react-icons/io5";
import { Link } from "react-router-dom";
const ProfileAside = ({
	name,
	page,
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
							<Link
								to={`/profile#/${link}`}
								className={
									page === link
										? "profile__container__aside__content__nav__link--active"
										: ""
								}
								onClick={() => handleChangePage(link)}
							>
								<div>
									<span>{name}</span>
								</div>
							</Link>
						</li>
					))}
				</ul>

				<ul
					className="profile__container__aside__content__nav"
					style={{ borderBottom: "none" }}
				>
					<li>
						<button type="button" onClick={handleLogOut}>
							<div>Log out</div>
						</button>
					</li>
				</ul>
			</div>
			<div></div>
		</div>
	);
};

export default ProfileAside;
