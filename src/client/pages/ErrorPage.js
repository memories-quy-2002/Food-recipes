// ErrorPage.js
import React from "react";
import "../styles/Error.scss";
const ErrorPage = () => {
	return (
		<div className="error__container">
			<h1>404 Not Found</h1>
			<p>Sorry, the page you are looking for does not exist.</p>
			{/* Additional styling or content can be added */}
		</div>
	);
};

export default ErrorPage;
