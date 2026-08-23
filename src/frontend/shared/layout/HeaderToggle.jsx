import React, { useContext } from "react";
import { Button, Offcanvas } from "react-bootstrap";
import { FaBars } from "react-icons/fa6";
import { useDispatch } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "@/app/AuthProvider";
import { authActions } from "@/features/auth/state/authSlice";
import { isNavigationItemActive } from "./navigation";

const HeaderToggle = ({ show, handleClose, handleShow, items }) => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const { auth } = useContext(AuthContext);
	const { user, isAuthenticated } = auth.current;
	const handleNavigate = (href) => {
		navigate(href);
		handleClose();
	};

	return (
		<div className="header__toggle">
			<Button
				aria-label="Open navigation menu"
				aria-expanded={show}
				onClick={handleShow}
				className="header__toggle__icon"
			>
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
					<nav aria-label="Mobile primary navigation">
					<ul className="header__toggle__list">
						{items.map(({ title, href }, index) => (
							<li
								key={index}
								className="header__toggle__list__item"
							>
								<Link
									type="button"
									className={`header__toggle__list__item__link${
										isNavigationItemActive(pathname, href, items)
											? " header__toggle__list__item__link--active"
											: ""
									}`}
									aria-current={
										isNavigationItemActive(pathname, href, items)
											? "page"
											: undefined
									}
									to={href}
									onClick={handleClose}
								>
									{title}
								</Link>
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
					</nav>
				</Offcanvas.Body>
			</Offcanvas>
		</div>
	);
};

export default HeaderToggle;
