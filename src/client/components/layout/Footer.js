import React from "react";
import "../../styles/Footer.scss";
const Footer = () => {
	return (
		<footer className="footer">
			<div className="container container-fluid">
				<div className="row footer__links">
					<div className="col footer__col">
						<h5 className="footer__title">Docs</h5>
						<ul className="footer__items">
							<li className="footer__item">Lorem ipsum</li>
							<li className="footer__item">Lorem ipsum</li>
							<li className="footer__item">Lorem ipsum</li>
							<li className="footer__item">Lorem ipsum</li>
						</ul>
					</div>
					<div className="col footer__col">
						<h5 className="footer__title">Docs</h5>
						<ul className="footer__items">
							<li className="footer__item">Lorem ipsum</li>
							<li className="footer__item">Lorem ipsum</li>
							<li className="footer__item">Lorem ipsum</li>
							<li className="footer__item">Lorem ipsum</li>
						</ul>
					</div>
					<div className="col footer__col">
						<h5 className="footer__title">Docs</h5>
						<ul className="footer__items">
							<li className="footer__item">Lorem ipsum</li>
							<li className="footer__item">Lorem ipsum</li>
							<li className="footer__item">Lorem ipsum</li>
							<li className="footer__item">Lorem ipsum</li>
						</ul>
					</div>
				</div>
				<div className="footer__bottom text-center">
					<div class="footer__copyright ">
						Copyright © 2023 React Bootstrap. Built with Docusaurus.
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
