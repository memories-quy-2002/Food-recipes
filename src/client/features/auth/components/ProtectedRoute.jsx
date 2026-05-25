import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ children }) => {
	const location = useLocation();
	const { local, session } = useSelector((state) => state.auth);
	const isAuthenticated = local.isAuthenticated || session.isAuthenticated;

	if (!isAuthenticated) {
		return (
			<Navigate
				to="/account?signup=false"
				replace
				state={{ from: location.pathname + location.search }}
			/>
		);
	}

	return children;
};

export default ProtectedRoute;
