import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import "../../styles/Footer.scss";
import { FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa6";
const Footer = () => {
	return (
		<footer className="footer">
			<Container fluid>
				<Row>
					<Col md={4}>
						<h5 className="footer__title">About Us</h5>
						<p className="footer__text">
							We are passionate about food and love to share our
							recipes with the world.
						</p>
					</Col>
					<Col md={4}>
						<h5 className="footer__title">Contact Us</h5>
						<ul className="footer__list">
							<li className="footer__list__link">
								Email: info@foodrecipe.com
							</li>
							<li className="footer__list__link">
								Phone: +1 (123) 456-7890
							</li>
							<li className="footer__list__link">
								Address: 123 Main St, Anytown USA
							</li>
						</ul>
					</Col>
					<Col md={4}>
						<h5 className="footer__title">Follow Us</h5>
						<ul className="footer__social">
							<li className="footer__social__item">
								<a href="/" className="footer__social__link">
									<FaFacebook color="black" size={24} />
								</a>
							</li>
							<li className="footer__social__item">
								<a href="/" className="footer__social__link">
									<FaInstagram color="black" size={24} />
								</a>
							</li>
							<li className="footer__social__item">
								<a href="/" className="footer__social__link">
									<FaLinkedin color="black" size={24} />
								</a>
							</li>
						</ul>
					</Col>
				</Row>

				<div className="footer__bottom text-center">
					<p>&copy; 2023 Food Recipe. Built with ReactJS.</p>
				</div>
			</Container>
		</footer>
	);
};

export default Footer;
