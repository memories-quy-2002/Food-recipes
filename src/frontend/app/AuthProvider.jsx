import React, { createContext, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { authActions } from "@/features/auth/state/authSlice";
import { getAccessToken } from "@/features/auth/state/authTokenStore";
import { authSessionApi } from "@/features/auth/api/authSessionApi";

export const AuthContext = createContext({});

const AuthProvider = ({ children }) => {
	const auth = useRef({ isAuthenticated: false, userId: 0 });
	const bootstrapPromise = useRef(null);
	const dispatch = useDispatch();

	const { hydrated, local, session } = useSelector((state) => state.auth);
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
	const token = isAuthenticated ? getAccessToken() : null;

	useEffect(() => {
		let active = true;
		bootstrapPromise.current ??= authSessionApi.refresh();
		bootstrapPromise.current
			.then(({ user }) => {
				if (active) dispatch(authActions.restoreSession({ user }));
			})
			.catch(() => {
				if (active && !getAccessToken()) dispatch(authActions.logout());
			})
			.finally(() => {
				if (active) dispatch(authActions.setHydrated(true));
			});

		const handleExpiredAuth = () => {
			dispatch(authActions.logout());
		};

		window.addEventListener("auth:expired", handleExpiredAuth);
		return () => {
			active = false;
			window.removeEventListener("auth:expired", handleExpiredAuth);
		};
	}, [dispatch]);

	auth.current = {
		isAuthenticated: isAuthenticated,
		hydrated,
		user: user,
		userId: userId,
		token,
	};

	return (
		<AuthContext.Provider value={{ auth }}>{children}</AuthContext.Provider>
	);
};

export default AuthProvider;
