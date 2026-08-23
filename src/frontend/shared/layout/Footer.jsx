import React from "react";
import { Link } from "react-router-dom";
import { BsMailbox } from "react-icons/bs";
import { FaHouse, FaPhone } from "react-icons/fa6";
import { siteContent } from "@/shared/utils/siteContent";

const Footer = () => {
	const d = new Date();
	const {
		about,
		contact,
		primaryNavigation,
		secondaryNavigation,
		follow,
		bottom,
	} = siteContent;

	return (
		<footer className="fr-footer">
			<div className="fr-footer__inner">
				<div className="fr-footer__brand">
					<Link to="/" className="fr-brand">
						<span className="fr-brand__mark" aria-hidden="true" />
						<span>food / recipes</span>
					</Link>
					<h2>About us</h2>
					<p>{about}</p>
				</div>
				<div>
					<h2>Contact</h2>
					<ul className="fr-footer__list">
						<li><BsMailbox aria-hidden="true" /> {contact.email}</li>
						<li><FaPhone aria-hidden="true" /> {contact.phone}</li>
						<li><FaHouse aria-hidden="true" /> {contact.address}</li>
					</ul>
				</div>
				<div>
					<h2>Explore</h2>
					<ul className="fr-footer__list">
						{primaryNavigation.map((item) => (
							<li key={item.href}>
								<Link to={item.href}>{item.title}</Link>
							</li>
						))}
					</ul>
					<h2>More</h2>
					<ul className="fr-footer__list">
						{secondaryNavigation.map((item) => (
							<li key={item.href}>
								<Link to={item.href}>{item.title}</Link>
							</li>
						))}
					</ul>
				</div>
				<div className="fr-footer__social">
					<h2>Follow us</h2>
					<ul>
						{follow.map(({ href, Icon, label }) => (
							<li key={href}>
								<a
									href={href}
									target="_blank"
									rel="noopener noreferrer"
									aria-label={`Visit Food Recipes on ${label}`}
								>
									<Icon size={20} />
								</a>
							</li>
						))}
					</ul>
				</div>
				<div className="fr-footer__bottom">
					<p>&copy; {d.getFullYear()} {bottom}</p>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
