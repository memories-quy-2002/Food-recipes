import React from "react";
import { Button, Offcanvas } from "react-bootstrap";
import {
	BsBoxArrowRight,
	BsCartFill,
	BsFillPersonFill,
	BsSearch,
} from "react-icons/bs";
import { FaBars } from "react-icons/fa6";

const HeaderToggle = ({ show, handleClose, handleShow }) => {
	return (
		<div className="header__toggle">
			<Button onClick={handleShow} className="header__toggle__icon">
				<FaBars size={30} />
			</Button>

			<Offcanvas
				show={show}
				onHide={handleClose}
				scroll="true"
				className="header__toggle__menu"
			>
				<Offcanvas.Header closeButton>
					<Offcanvas.Title>Menu</Offcanvas.Title>
				</Offcanvas.Header>
				<Offcanvas.Body style={{ padding: 0 }}>
					<ul className="header__toggle__links">
						<li>
							<a href="/cart">
								<BsCartFill /> {""}
								My cart
							</a>
						</li>
						<li>
							<a href="/signup">
								<BsFillPersonFill /> {""}
								Sign up
							</a>
						</li>
						<li>
							<a href="/login">
								<BsBoxArrowRight /> {""}
								Log in
							</a>
						</li>
					</ul>
					<div class="header__toggle__wrap">
						<div div class="header__toggle__search">
							<input type="text" placeholder="Search..." />
							<button>
								<BsSearch />
							</button>
						</div>
					</div>
				</Offcanvas.Body>
			</Offcanvas>
		</div>
	);
};

export default HeaderToggle;
