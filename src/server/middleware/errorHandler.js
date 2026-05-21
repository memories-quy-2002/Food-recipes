const notFoundHandler = (request, response) => {
	response.status(404).json({
		message: `Route not found: ${request.method} ${request.originalUrl}`,
	});
};

const errorHandler = (error, request, response, next) => {
	if (response.headersSent) {
		next(error);
		return;
	}

	if (error && error.code === "EBADCSRFTOKEN") {
		return response.status(403).json({ message: "Invalid CSRF token" });
	}

	const statusCode = error.statusCode || error.status || 500;
	const isServerError = statusCode >= 500;

	console.error(
		`[error] ${JSON.stringify({
			type: "server_error",
			method: request.method,
			path: request.originalUrl,
			status: statusCode,
			message: error.message,
			stack: isServerError ? error.stack : undefined,
		})}`
	);

	response.status(statusCode).json({
		message: isServerError ? "Internal Server Error" : error.message,
	});
};

module.exports = {
	errorHandler,
	notFoundHandler,
};
