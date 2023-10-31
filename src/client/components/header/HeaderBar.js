import React from "react";
import { website_content } from "../../utils/constant";
import { FaPhone } from "react-icons/fa6";
import { BsMailbox } from "react-icons/bs";

const HeaderBar = () => {
	const { contact, follow } = website_content;
	return (
		<div className="header__bar">
			<div className="header__bar__content">
				<p>
					<FaPhone /> {contact.phone}
				</p>
				<p>
					<BsMailbox /> {contact.email}
				</p>
			</div>
			<div>
				<ul className="header__bar__follow">
					{follow.map((item, index) => (
						<li key={index}>
							<a href="/">{item}</a>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
};

export default HeaderBar;
