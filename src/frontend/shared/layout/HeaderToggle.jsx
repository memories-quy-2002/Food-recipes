import React, { useContext, useEffect, useRef } from "react";
import { FaBars, FaXmark } from "react-icons/fa6";
import { useDispatch } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "@/app/AuthProvider";
import { authActions } from "@/features/auth/state/authSlice";
import { isNavigationItemActive } from "./navigation";
import Button from "@/shared/ui/Button";

const HeaderToggle = ({ show, handleClose, handleShow, items }) => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const { auth } = useContext(AuthContext);
	const { user, isAuthenticated } = auth.current;
	const drawerRef = useRef(null);
	const closeButtonRef = useRef(null);
	const restoreFocusRef = useRef(null);

	useEffect(() => {
		if (!show || typeof document === "undefined") return undefined;

		restoreFocusRef.current = document.activeElement;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		const focusableSelector =
			'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

		const focusCloseButton = () => closeButtonRef.current?.focus();
		const handleKeyDown = (event) => {
			if (event.key === "Escape") {
				event.preventDefault();
				handleClose();
				return;
			}

			if (event.key !== "Tab") return;
			const focusable = drawerRef.current?.querySelectorAll(focusableSelector);
			if (!focusable?.length) return;

			const first = focusable[0];
			const last = focusable[focusable.length - 1];
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		const frameId = window.requestAnimationFrame(focusCloseButton);

		return () => {
			window.cancelAnimationFrame(frameId);
			document.removeEventListener("keydown", handleKeyDown);
			document.body.style.overflow = previousOverflow;
			if (restoreFocusRef.current instanceof HTMLElement) {
				restoreFocusRef.current.focus();
			}
		};
	}, [handleClose, show]);
	const handleNavigate = (href) => {
		navigate(href);
		handleClose();
	};

	return (
		<div className="fr-mobile">
			<Button
				variant="outline"
				size="icon"
				aria-label="Open navigation menu"
				aria-expanded={show}
				aria-controls="fr-mobile-navigation"
				onClick={handleShow}
				className="fr-mobile__trigger"
			>
				<FaBars size={18} />
			</Button>

			{show ? (
				<div className="fr-mobile__overlay" role="presentation">
					<button
						type="button"
						aria-label="Close navigation menu"
						tabIndex={-1}
						className="fr-mobile__backdrop"
						onClick={handleClose}
					/>
					<aside
						id="fr-mobile-navigation"
						ref={drawerRef}
						className="fr-mobile__drawer"
						role="dialog"
						aria-modal="true"
						aria-label="Mobile navigation"
					>
						<div className="fr-mobile__drawer-header">
							<div>
								<p className="fr-mobile__eyebrow">FOOD RECIPES</p>
								<strong>
									{isAuthenticated
									? "Welcome " + (user?.full_name || "there")
										: "Welcome Guest"}
								</strong>
							</div>
							<Button
								ref={closeButtonRef}
								variant="ghost"
								size="icon"
								aria-label="Close navigation menu"
								onClick={handleClose}
							>
								<FaXmark size={18} />
							</Button>
						</div>
						<nav aria-label="Mobile primary navigation">
							<ul className="fr-mobile__list">
								{items.map(({ title, href }, index) => (
									<li key={index}>
										<Link
											className={
												"fr-mobile__link" +
												(isNavigationItemActive(
													pathname,
													href,
													items
												)
													? " fr-mobile__link--active"
													: "")
											}
											aria-current={
												isNavigationItemActive(
													pathname,
													href,
													items
												)
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
									<li>
										<button
											type="button"
											className="fr-mobile__link"
											onClick={() => {
												dispatch(authActions.logout());
												handleNavigate("/");
											}}
										>
											Sign out
										</button>
									</li>
								) : (
									<li>
										<button
											type="button"
											className="fr-mobile__link"
											onClick={() =>
												handleNavigate("/account")
											}
										>
											Sign up
										</button>
									</li>
								)}
							</ul>
						</nav>
					</aside>
				</div>
			) : null}
		</div>
	);
};

export default HeaderToggle;
