import React, { useContext } from "react";
import { Button, Offcanvas } from "react-bootstrap";
import { FaBars } from "react-icons/fa6";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthProvider.jsx";
import { authActions } from "../../redux/authSlice.jsx";

const HeaderToggle = ({ show, handleClose, handleShow, items }) => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const { auth } = useContext(AuthContext);
	const { user, isAuthenticated } = auth.current;
	const isActive = (href) =>
		href === "/" ? pathname === href : pathname.startsWith(href);
	const handleNavigate = (href) => {
		navigate(href);
		handleClose();
	};

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
						{items.map(({ title, href }, index) => (
							<li
								key={index}
								className="header__toggle__list__item"
							>
								<button
									type="button"
									className={`header__toggle__list__item__link${
										isActive(href)
											? " header__toggle__list__item__link--active"
											: ""
									}`}
									onClick={() => handleNavigate(href)}
								>
									{title}
								</button>
							</li>
						))}
						{isAuthenticated ? (
							<li className="header__toggle__list__item">
								<button
									type="button"
									className="header__toggle__list__item__link"
									onClick={() => {
										dispatch(authActions.logout());
										handleNavigate("/");
									}}
								>
									Sign out
								</button>
							</li>
						) : (
							<li className="header__toggle__list__item">
								<button
									type="button"
									className="header__toggle__list__item__link"
									onClick={() => handleNavigate("/account")}
								>
									Sign up
								</button>
							</li>
						)}
					</ul>
				</Offcanvas.Body>
			</Offcanvas>
		</div>
	);
};

export default HeaderToggle;
