// ErrorPage.js
import React from "react";
import PageHelmet from "@/shared/seo/PageHelmet";
import "./Error.scss";
const ErrorPage = () => {
	return (
		<div className="error__container">
			<PageHelmet
				title="Page Not Found"
				description="The page you requested could not be found on Food Recipes."
				path="/404"
				noIndex
			/>
			<h1>404 Not Found</h1>
			<p>Sorry, the page you are looking for does not exist.</p>
			{/* Additional styling or content can be added */}
		</div>
	);
};

export default ErrorPage;
