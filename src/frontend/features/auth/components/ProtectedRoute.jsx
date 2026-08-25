import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
	beginAuthIntent,
	getAuthReturnPath,
} from "@/features/auth/returnIntent";

const ProtectedRoute = ({ children }) => {
	const location = useLocation();
	const { hydrated, local, session } = useSelector((state) => state.auth);
	const isAuthenticated = local.isAuthenticated || session.isAuthenticated;

	if (!hydrated) {
		return (
			<div className="flex min-h-[40vh] items-center justify-center px-6 py-16" role="status" aria-live="polite">
				<p className="text-sm font-semibold text-muted-foreground">Checking your session…</p>
			</div>
		);
	}

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
