import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
	beginAuthIntent,
	getAuthReturnPath,
} from "@/features/auth/returnIntent";

const ProtectedRoute = ({ children }) => {
	const location = useLocation();
	const { local, session } = useSelector((state) => state.auth);
	const isAuthenticated = local.isAuthenticated || session.isAuthenticated;

	if (!isAuthenticated) {
		const returnTo = `${location.pathname}${location.search}${location.hash}`;
		const safeReturnTo = getAuthReturnPath({ state: { from: returnTo } });
		beginAuthIntent({ returnTo: safeReturnTo });
		return (
			<Navigate
				to="/account?signup=false"
				replace
				state={{ from: safeReturnTo }}
			/>
		);
	}

	return children;
};

export default ProtectedRoute;
