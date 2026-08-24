// ErrorPage.js
import React from "react";
import { Link } from "react-router-dom";
import PageHelmet from "@/shared/seo/PageHelmet";
import "./Error.scss";
const ErrorPage = () => {
	return (
		<main className="error__container">
			<PageHelmet
				title="Page Not Found"
				description="The page you requested could not be found on Food Recipes."
				path="/404"
				noIndex
			/>
			<div className="error__panel">
				<span className="error__eyebrow">Page not found</span>
				<h1>That recipe page is missing.</h1>
				<p>Sorry, the page you are looking for does not exist or has moved.</p>
				<Link className="error__action" to="/food">Browse recipes</Link>
			</div>
		</main>
	);
};

export default ErrorPage;
