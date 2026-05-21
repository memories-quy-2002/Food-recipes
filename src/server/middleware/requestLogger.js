const requestLogger = (request, response, next) => {
	const startedAt = Date.now();

	response.on("finish", () => {
		const durationMs = Date.now() - startedAt;
		const logLevel = response.statusCode >= 500 ? "error" : "log";
		const logEntry = {
			type: "request",
			method: request.method,
			path: request.originalUrl,
			status: response.statusCode,
			durationMs,
			origin: request.get("origin") || null,
			ip: request.ip,
		};

		console[logLevel](`[request] ${JSON.stringify(logEntry)}`);
	});

	next();
};

module.exports = requestLogger;
