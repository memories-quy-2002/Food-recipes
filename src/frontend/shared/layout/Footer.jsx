import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import { BsMailbox } from "react-icons/bs";
import { FaHouse, FaPhone } from "react-icons/fa6";
import "./Footer.scss";
import { website_content } from "@/shared/utils/constant";
const Footer = () => {
	const d = new Date();
	const {
		about,
		contact,
		primaryNavigation,
		secondaryNavigation,
		follow,
		bottom,
	} = website_content;

	return (
		<footer className="footer">
			<Container fluid>
				<Row className="footer__grid">
					<Col lg={5} md={6}>
						<Link to="/" className="footer__brand">
							Food Recipes
						</Link>
						<h5 className="footer__title">About Us</h5>
						<p className="footer__text">{about}</p>
					</Col>
					<Col lg={4} md={6}>
						<h5 className="footer__title">Contact Us</h5>
						<ul className="footer__list">
							<li className="footer__list__link">
								<BsMailbox /> {contact.email}
							</li>
							<li className="footer__list__link">
								<FaPhone /> {contact.phone}
							</li>
							<li className="footer__list__link">
								<FaHouse /> {contact.address}
							</li>
						</ul>
					</Col>
					<Col lg={3} md={12}>
						<h5 className="footer__title">Explore</h5>
						<ul className="footer__list">
							{primaryNavigation.map((item) => (
								<li key={item.href} className="footer__list__link">
									<Link to={item.href}>
										{item.title}
									</Link>
								</li>
							))}
						</ul>
						<h5 className="footer__title">More</h5>
						<ul className="footer__list">
							{secondaryNavigation.map((item) => (
								<li key={item.href} className="footer__list__link">
									<Link to={item.href}>{item.title}</Link>
								</li>
							))}
						</ul>
					</Col>
				</Row>
				<div className="footer__social">
					<h5 className="footer__title">Follow Us</h5>
					<ul className="footer__social__list">
						{follow.map(({ href, Icon }) => (
							<a key={href} href={href} target="_blank" rel="noopener noreferrer">
								<Icon size={20} />
							</a>
						))}
					</ul>
				</div>

				<div className="footer__bottom text-center">
					<p>&copy; {`${d.getFullYear()} ${bottom} `}</p>
				</div>
			</Container>
		</footer>
	);
};

export default Footer;
