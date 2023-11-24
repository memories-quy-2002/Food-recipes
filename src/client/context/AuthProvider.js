import React, { createContext, useRef } from "react";
import { useSelector } from "react-redux";

export const AuthContext = createContext({});

const AuthProvider = ({ children }) => {
	const auth = useRef({ isAuthenticated: false, userId: 0 });

	const { local, session } = useSelector((state) => state.auth);
	const isAuthenticated = local?.isAuthenticated || session?.isAuthenticated;
	const userId = isAuthenticated
		? local?.isAuthenticated
			? local?.user?.user_id
			: session?.user?.user_id
		: 0;

	auth.current = { isAuthenticated: isAuthenticated, userId: userId };

	return (
		<AuthContext.Provider value={{ auth }}>{children}</AuthContext.Provider>
	);
};

export default AuthProvider;
