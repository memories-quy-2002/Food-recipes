import React, { useContext } from "react";
import { Button, Offcanvas } from "react-bootstrap";
import { FaBars } from "react-icons/fa6";
import { useDispatch } from "react-redux";
import { AuthContext } from "../../context/AuthProvider.jsx";
import { authActions } from "../../redux/authSlice.jsx";

const HeaderToggle = ({ show, handleClose, handleShow, items }) => {
	const dispatch = useDispatch();
	const { auth } = useContext(AuthContext);
	const { user, isAuthenticated } = auth.current;
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
					<ul className="header__toggle__list">
						{items.map(({ title, icon, href }, index) => (
							<li
								key={index}
								className="header__toggle__list__item"
							>
								<a
									href={href}
									className="header__toggle__list__item__link"
								>
									{title}
								</a>
							</li>
						))}
						{isAuthenticated ? (
							<li className="header__toggle__list__item">
								<a
									href="/"
									className="header__toggle__list__item__link"
									onClick={() =>
										dispatch(authActions.logout())
									}
								>
									Sign out
								</a>
							</li>
						) : (
							<li className="header__toggle__list__item">
								<a
									href="/account"
									className="header__toggle__list__item__link"
								>
									Sign up
								</a>
							</li>
						)}
					</ul>
				</Offcanvas.Body>
			</Offcanvas>
		</div>
	);
};

export default HeaderToggle;
