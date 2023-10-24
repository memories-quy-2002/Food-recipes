import React from "react";
import { Button, Offcanvas } from "react-bootstrap";
import { BsFillPersonFill, BsSearch } from "react-icons/bs";
import { FaBars } from "react-icons/fa6";
import { useDispatch } from "react-redux";
import { authActions } from "../../redux/authSlice";

const HeaderToggle = ({ show, handleClose, handleShow, items, auth }) => {
	const dispatch = useDispatch();
	const { isAuthenticated, user } = auth;
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
					<Offcanvas.Title>
						{isAuthenticated
							? `Welcome ${user.full_name}`
							: "Welcome Guest"}
					</Offcanvas.Title>
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
						{isAuthenticated ? (
							<li className="header__toggle__item">
								<a
									href="/"
									className="header__toggle__item__link"
									onClick={() =>
										dispatch(authActions.logout())
									}
								>
									{<BsFillPersonFill />} {""}
									Sign out
								</a>
							</li>
						) : (
							<li className="header__toggle__item">
								<a
									href="/account"
									className="header__toggle__item__link"
								>
									{<BsFillPersonFill />} {""}
									Sign up
								</a>
							</li>
						)}
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
