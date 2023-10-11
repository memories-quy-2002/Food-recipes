import React from "react";
import { Button, Offcanvas } from "react-bootstrap";
import { BsSearch } from "react-icons/bs";
import { FaBars } from "react-icons/fa6";

const HeaderToggle = ({ show, handleClose, handleShow, items }) => {
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
					<ul className="header__toggle__items">
						{items.map(({ title, icon, href }, index) => (
							<li key={index} className="header__toggle__item">
								<a
									href={href}
									className="header__toggle__item__link"
								>
									{icon} {""}
									{title}
								</a>
							</li>
						))}
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
