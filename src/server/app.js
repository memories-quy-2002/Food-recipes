const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const requestLogger = require("./middleware/requestLogger");
const { registerRoutes } = require("./routes");
const {
	errorHandler,
	notFoundHandler,
} = require("./middleware/errorHandler");

const PORT = 4000;
const app = express();
const allowedOrigins = new Set([
	"http://localhost:5173",
	"http://127.0.0.1:5173",
	"https://foodrecipes1.vercel.app",
	"https://www.foodrecipes1.vercel.app",
]);
const isAllowedOrigin = (origin) =>
	!origin ||
	allowedOrigins.has(origin) ||
	/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
const corsOptions = {
	origin(origin, callback) {
		if (isAllowedOrigin(origin)) {
			callback(null, true);
			return;
		}

		const error = new Error(`CORS blocked origin: ${origin}`);
		error.status = 403;
		callback(error);
	},
	credentials: true,
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization"],
	optionsSuccessStatus: 204,
};

var limiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 1000,
});

app.use(requestLogger);
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use((req, res, next) => {
	if (req.url === "/api") {
		req.url = "/";
	} else if (req.url.startsWith("/api/")) {
		req.url = req.url.slice(4);
	}
	next();
});
app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
registerRoutes(app);
app.get("/", (req, res) => {
	res.send("Hello World from Express");
});
app.use(notFoundHandler);
app.use(errorHandler);

if (process.env.VERCEL !== "1") {
	app.listen(PORT, () => {
		console.log(`Server is running on port ${PORT}.`);
	});
}

module.exports = app;
