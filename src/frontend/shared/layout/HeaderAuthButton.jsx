import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import axios from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";
import { authActions } from "@/features/auth/state/authSlice";
import convertImage from "@/shared/utils/convertImage";
import { FaCaretDown } from "react-icons/fa";
import Button from "@/shared/ui/Button";

const HeaderAuthButton = ({ auth }) => {
	const { local, session } = auth;
	const token = local.token || session.token;
	const [user, setUser] = useState({});
	const [clicked, setClicked] = useState(false);
	const menuRef = useRef(null);
	const toggleRef = useRef(null);
	const closeMenu = useCallback(() => {
		setClicked(false);
		toggleRef.current?.focus();
	}, []);
	const isAuthenticated = local.isAuthenticated || session.isAuthenticated;
	const dispatch = useDispatch();
	const navigate = useNavigate();

	useEffect(() => {
		const fetchData = async () => {
			if (token) {
				try {
					const response = await axios.post(apiRoutes.authToken, {
						token,
					});

					setUser(response.data.user ?? response.data);
				} catch (error) {
					if (error.response && error.response.status === 401) {
						dispatch(authActions.logout());
						navigate("/");
					}
				}
			} else if (session.user) {
				setUser(session.user);
			}
		};

		fetchData();
	}, [token, session.user, dispatch, navigate]);

	useEffect(() => {
		if (!clicked || typeof document === "undefined") return undefined;

		const handlePointerDown = (event) => {
			if (
				!menuRef.current?.contains(event.target) &&
				!toggleRef.current?.contains(event.target)
			) {
				closeMenu();
			}
		};
		const handleKeyDown = (event) => {
			if (event.key === "Escape") {
				event.preventDefault();
				closeMenu();
			}
		};

		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);
		const firstMenuItem = menuRef.current?.querySelector("a");
		firstMenuItem?.focus();

		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [clicked, closeMenu]);

	const handleSignOut = () => {
		dispatch(authActions.logout());
		closeMenu();
	};
	const handleClick = () => {
		navigate("/account?login=true");
	};
	return (
		<div className="fr-auth">
			{isAuthenticated ? (
				<div className="fr-auth__user">
					<button
						type="button"
						ref={toggleRef}
						className="fr-auth__user-button"
						aria-expanded={clicked}
						aria-haspopup="menu"
						aria-controls="fr-auth-menu"
						onClick={() => setClicked((clicked) => !clicked)}
					>
						{convertImage(
							"avatar",
							"fr-auth__avatar"
						)}
						<span>{user?.full_name || "Unknown"}</span>
						<FaCaretDown />
					</button>
					{clicked && (
						<div
							id="fr-auth-menu"
							ref={menuRef}
							className="fr-auth__menu"
							role="menu"
						>
							<Link
								to="/profile"
								role="menuitem"
								onClick={closeMenu}
							>
								My Profile
							</Link>
							<Link to="/" role="menuitem" onClick={handleSignOut}>
								Sign out
							</Link>
						</div>
					)}
				</div>
			) : (
				<div className="fr-auth__guest">
					<Button
						type="button"
						onClick={handleClick}
						className="fr-button fr-button--primary"
					>
						Login / Sign up
					</Button>
				</div>
			)}
		</div>
	);
};

export default HeaderAuthButton;
