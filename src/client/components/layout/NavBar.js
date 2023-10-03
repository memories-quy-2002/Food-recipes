import React from "react";
import { Button, ButtonGroup } from "react-bootstrap";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { BsFillBoxFill } from "react-icons/bs";
import "../../styles/NavBar.scss";

const NavBar = () => {
	return (
		<Navbar expand="lg" className="navbar">
			<Container fluid>
				<Navbar.Collapse id="basic-navbar-nav">
					<Nav className="navbar__menu">
						<Nav.Link href="/" className="navbar__menuLink">
							Home
						</Nav.Link>
						<Nav.Link
							href="/categories"
							className="navbar__menuLink"
						>
							Categories
						</Nav.Link>
						<Nav.Link
							href="/hot_offers"
							className="navbar__menuLink"
						>
							Hot offers
						</Nav.Link>
						<Nav.Link href="/about" className="navbar__menuLink">
							About
						</Nav.Link>
						<Nav.Link href="/contact" className="navbar__menuLink">
							Contact
						</Nav.Link>
					</Nav>
				</Navbar.Collapse>
			</Container>
		</Navbar>
	);
};

export default NavBar;
