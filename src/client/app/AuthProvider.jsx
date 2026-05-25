import React, { createContext, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { authActions } from "@/features/auth/state/authSlice";

export const AuthContext = createContext({});

const AuthProvider = ({ children }) => {
	const auth = useRef({ isAuthenticated: false, userId: 0 });
	const dispatch = useDispatch();

	const { local, session } = useSelector((state) => state.auth);
	const isAuthenticated = local?.isAuthenticated || session?.isAuthenticated;
	const userId = isAuthenticated
		? local?.isAuthenticated
			? local?.user?.user_id
			: session?.user?.user_id
		: 0;
	const user = isAuthenticated
		? local?.isAuthenticated
			? local?.user
			: session?.user
		: null;
	const token = isAuthenticated
		? local?.isAuthenticated
			? local?.token
			: session?.token
		: null;

	useEffect(() => {
		const handleExpiredAuth = () => {
			dispatch(authActions.logout());
		};

		window.addEventListener("auth:expired", handleExpiredAuth);
		return () => {
			window.removeEventListener("auth:expired", handleExpiredAuth);
		};
	}, [dispatch]);

	auth.current = {
		isAuthenticated: isAuthenticated,
		user: user,
		userId: userId,
		token,
	};

	return (
		<AuthContext.Provider value={{ auth }}>{children}</AuthContext.Provider>
	);
};

export default AuthProvider;
