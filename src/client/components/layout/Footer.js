import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import { BsMailbox } from "react-icons/bs";
import { FaHouse, FaPhone } from "react-icons/fa6";
import "../../styles/Footer.scss";
import { website_content } from "../../utils/constant";
const Footer = () => {
	const d = new Date();
	const { about, contact, overview, follow, bottom } = website_content;

	return (
		<footer className="footer">
			<Container fluid>
				<Row>
					<Col md={4}>
						<h5 className="footer__title">About Us</h5>
						<p className="footer__text">{about}</p>
					</Col>
					<Col md={4}>
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
					<Col md={4}>
						<h5 className="footer__title">Overview</h5>
						<ul className="footer__list">
							{overview.map((item, index) => (
								<li key={index} className="footer__list__link">
									<a href="/">{item}</a>
								</li>
							))}
						</ul>
					</Col>
				</Row>
				<div className="footer__social">
					<h5 className="footer__title">Follow Us</h5>
					<ul className="footer__social__list">
						{follow.map((item, index) => (
							<li key={index} className="footer__social__item">
								<a href="/" className="footer__social__link">
									{item}
								</a>
							</li>
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
