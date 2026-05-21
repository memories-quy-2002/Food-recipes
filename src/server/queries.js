const pg = require("pg");
const utils = require("./utils");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const sanitizeFilename = require("sanitize-filename");
require("dotenv").config();
let attachDatabasePool;

try {
	({ attachDatabasePool } = require("@vercel/functions"));
} catch {
	attachDatabasePool = null;
}

const {
	DB_USER,
	DB_PASSWORD,
	DB_HOST,
	DB_PORT,
	DB_NAME,
	DB_SSL_CA_PATH,
	JWT_SECRET,
} = process.env;
const Pool = pg.Pool;
const caPath = path.join(__dirname, "ca.pem");
const poolKey = "__foodRecipesPgPool";
const requiredDbEnvVars = {
	DB_USER,
	DB_PASSWORD,
	DB_HOST,
	DB_PORT,
	DB_NAME,
};

const getJwtSecret = () => {
	if (!JWT_SECRET) {
		throw new Error("Missing JWT_SECRET environment variable.");
	}

	return JWT_SECRET;
};

const getPositiveInteger = (value, fallback) => {
	const parsedValue = Number.parseInt(value, 10);
	return Number.isInteger(parsedValue) && parsedValue >= 0
		? parsedValue
		: fallback;
};

const validateDatabaseConfig = () => {
	const missingEnvVars = Object.entries(requiredDbEnvVars)
		.filter(([, value]) => !value)
		.map(([name]) => name);

	if (missingEnvVars.length > 0) {
		throw new Error(
			`Missing required database environment variables: ${missingEnvVars.join(
				", "
			)}`
		);
	}
};

const getSslConfig = () => {
	if (process.env.DB_SSL === "false") return false;

	const resolvedCaPath = DB_SSL_CA_PATH
		? path.resolve(DB_SSL_CA_PATH)
		: caPath;

	if (fs.existsSync(resolvedCaPath)) {
		return {
			rejectUnauthorized: true,
			ca: fs.readFileSync(resolvedCaPath).toString(),
		};
	}

	console.error(
		`[database] SSL CA file was not found at ${resolvedCaPath}. Falling back to default SSL verification.`
	);

	return {
		rejectUnauthorized: true,
	};
};

const getDatabaseHealth = async (request, response) => {
	const sslCaPath = DB_SSL_CA_PATH ? path.resolve(DB_SSL_CA_PATH) : caPath;
	const configStatus = {
		dbUser: Boolean(DB_USER),
		dbPassword: Boolean(DB_PASSWORD),
		dbHost: Boolean(DB_HOST),
		dbPort: Boolean(DB_PORT),
		dbName: Boolean(DB_NAME),
		jwtSecret: Boolean(JWT_SECRET),
		dbSsl: process.env.DB_SSL || "default",
		dbSslCaPath: DB_SSL_CA_PATH || null,
		dbSslCaFileExists: fs.existsSync(sslCaPath),
	};

	try {
		const result = await pool.query("SELECT 1 AS ok");
		return response.status(200).json({
			status: "ok",
			config: configStatus,
			database: result.rows[0],
		});
	} catch (error) {
		console.error(
			`[database] ${JSON.stringify({
				type: "database_health_error",
				errorCode: error?.code,
				errorMessage: error?.message,
				config: configStatus,
			})}`
		);

		return response.status(500).json({
			status: "error",
			message: "Database health check failed",
			errorCode: error?.code,
			errorMessage: error?.message,
			config: configStatus,
		});
	}
};

const normalizeQueryText = (queryConfig) => {
	const queryText =
		typeof queryConfig === "string" ? queryConfig : queryConfig?.text || "";
	return queryText.replace(/\s+/g, " ").trim();
};

const logDatabaseQuery = ({ queryText, durationMs, rowCount, error }) => {
	if (process.env.DB_QUERY_LOGGING === "false") return;

	const logEntry = {
		type: "database_query",
		status: error ? "error" : "success",
		durationMs,
		rowCount: rowCount ?? null,
		errorCode: error?.code,
		errorMessage: error?.message,
	};
	const logLevel = error ? "error" : "log";

	console[logLevel](`[database] ${JSON.stringify(logEntry)}`);
};

const instrumentPoolQueries = (pool) => {
	if (pool.__queryLoggingAttached) return pool;

	const originalQuery = pool.query.bind(pool);

	pool.query = (...args) => {
		const queryText = normalizeQueryText(args[0]);
		const startedAt = Date.now();
		const callbackIndex =
			typeof args[args.length - 1] === "function" ? args.length - 1 : -1;

		if (callbackIndex >= 0) {
			const originalCallback = args[callbackIndex];

			args[callbackIndex] = (error, result) => {
				logDatabaseQuery({
					queryText,
					durationMs: Date.now() - startedAt,
					rowCount: result?.rowCount,
					error,
				});
				originalCallback(error, result);
			};

			return originalQuery(...args);
		}

		const queryResult = originalQuery(...args);

		if (queryResult && typeof queryResult.then === "function") {
			return queryResult
				.then((result) => {
					logDatabaseQuery({
						queryText,
						durationMs: Date.now() - startedAt,
						rowCount: result?.rowCount,
					});
					return result;
				})
				.catch((error) => {
					logDatabaseQuery({
						queryText,
						durationMs: Date.now() - startedAt,
						error,
					});
					throw error;
				});
		}

		logDatabaseQuery({
			queryText,
			durationMs: Date.now() - startedAt,
		});
		return queryResult;
	};

	Object.defineProperty(pool, "__queryLoggingAttached", {
		value: true,
		enumerable: false,
	});

	return pool;
};

const createPool = () => {
	validateDatabaseConfig();

	const pool = new Pool({
		user: DB_USER,
		password: DB_PASSWORD,
		host: DB_HOST,
		port: Number(DB_PORT),
		database: DB_NAME,
		max: getPositiveInteger(process.env.DB_POOL_MAX, 2),
		min: getPositiveInteger(process.env.DB_POOL_MIN, 0),
		idleTimeoutMillis: getPositiveInteger(
			process.env.DB_POOL_IDLE_TIMEOUT_MS,
			5000
		),
		connectionTimeoutMillis: getPositiveInteger(
			process.env.DB_POOL_CONNECTION_TIMEOUT_MS,
			5000
		),
		maxLifetimeSeconds: getPositiveInteger(
			process.env.DB_POOL_MAX_LIFETIME_SECONDS,
			60
		),
		allowExitOnIdle: true,
		ssl: getSslConfig(),
	});

	pool.on("error", (error) => {
		console.error("Unexpected PostgreSQL idle client error", error);
	});

	if (attachDatabasePool) {
		attachDatabasePool(pool);
	}

	return instrumentPoolQueries(pool);
};

const getPool = () => {
	const pool = instrumentPoolQueries(globalThis[poolKey] || createPool());
	globalThis[poolKey] = pool;
	return pool;
};

const pool = {
	query(...args) {
		try {
			return getPool().query(...args);
		} catch (error) {
			const callback =
				typeof args[args.length - 1] === "function"
					? args[args.length - 1]
					: null;

			if (callback) {
				callback(error);
				return undefined;
			}

			return Promise.reject(error);
		}
	},
};

const handleDbError = (response, error, message = "Database error") => {
	console.error(
		`[database] ${JSON.stringify({
			type: "database_error",
			message,
			errorCode: error?.code,
			errorMessage: error?.message,
			detail: error?.detail,
		})}`
	);
	if (response.headersSent) return;
	return response.status(500).json({ message });
};

const getUsersLogin = (request, response) => {
	const { email, password } = request.body;
	pool.query(
		"SELECT * FROM accounts WHERE email=$1 LIMIT 1",
		[email],
		(error, results) => {
			if (error) {
				return handleDbError(response, error, "Failed to fetch user");
			}
			if (results.rowCount === 0) {
				response.status(401).json({
					message: "The email you entered is not signed up!",
				});
				return;
			}

			const user = results.rows[0];
			(async () => {
				const match = await utils.checkPassword(
					password,
					user.password
				);
				if (!match) {
					response
						.status(401)
						.json({ message: "The password is incorrect!" });
					return;
				}
				pool.query(
					"UPDATE accounts SET last_login=CURRENT_TIMESTAMP WHERE user_id=$1",
					[user.user_id],
					(error, results) => {
						if (error) {
							return handleDbError(
								response,
								error,
								"Failed to update last login"
							);
						}
						const token = jwt.sign(
							{
								user_id: user.user_id,
								email: user.email,
							},
							getJwtSecret(),
							{ expiresIn: "30d" }
						);
						response.status(200).json({
							user,
							token,
							message: "Logged in!",
						});
					}
				);
			})();
		}
	);
};

const getUserByJWT = (request, response) => {
	const token = request.body.token;
	if (!token) {
		return response.status(400).json({ message: "Token is required" });
	}
	try {
		const payload = jwt.verify(token, getJwtSecret());
		pool.query(
			"SELECT * FROM accounts WHERE user_id = $1 LIMIT 1",
			[payload.user_id],
			(errors, results) => {
				if (errors) {
					return handleDbError(
						response,
						errors,
						"Failed to fetch user by JWT"
					);
				}
				if (results.rowCount === 0) {
					return response
						.status(404)
						.json({ message: "User not found" });
				}
				const user = results.rows[0];
				response.status(200).json({ user, message: "JWT Received" });
			}
		);
	} catch (err) {
		response.status(401).json({ message: "JWT Expired" });
		return;
	}
};

const createUser = (request, response) => {
	const { name, email, password } = request.body;

	(async () => {
		const hashedPassword = await utils.hashPassword(password);
		pool.query(
			"INSERT INTO accounts (full_name, email, password, created_on, last_login) " +
			"VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *",
			[name.first + " " + name.last, email, hashedPassword],
			(error, results) => {
				if (error) {
					return handleDbError(response, error, "Failed to create user");
				}
				const user = results.rows[0];
				const token = jwt.sign(
					{ user_id: user.user_id, email: user.email },
					getJwtSecret(),
					{
						expiresIn: "30d",
					}
				);
				response
					.status(200)
					.json({ user, token, message: "Signed up!" });
			}
		);
	})();
};

const updateUser = (request, response) => {
	const user_id = parseInt(request.params.uid);
	const { name, phoneNumber, address } = request.body.formData;
	pool.query(
		"UPDATE accounts SET full_name=$1, phone=$2, address=$3 WHERE user_id=$4 RETURNING *",
		[name, phoneNumber, address, user_id],
		(error, results) => {
			if (error) {
				return handleDbError(response, error, "Failed to update user");
			}
			const user = results.rows[0];
			response.status(200).send({
				message: `User modified with user_id: ${user_id}`,
				user: user,
			});
		}
	);
};

const updatePassword = async (request, response) => {
	const user_id = request.params.uid;
	const { currentPassword, newPassword } = request.body;

	try {
		const result = await pool.query(
			"SELECT * FROM accounts WHERE user_id = $1 LIMIT 1",
			[user_id]
		);

		if (result.rowCount === 0) {
			return response.status(404).json({ message: "User not found" });
		}

		const user = result.rows[0];
		const match = await utils.checkPassword(currentPassword, user.password);

		if (!match) {
			return response
				.status(401)
				.json({ message: "The current password is incorrect!" });
		}

		const hashedNewPassword = await utils.hashPassword(newPassword);
		await pool.query("UPDATE accounts SET password=$1 WHERE user_id=$2", [
			hashedNewPassword,
			user_id,
		]);

		response.status(200).json({
			message: "Password updated successfully!",
		});
	} catch (error) {
		console.error(error);
		response.status(500).json({
			message: "Internal Server Error",
		});
	}
};

const getRecipes = (request, response) => {
	pool.query(
		"SELECT r.recipe_id, r.recipe_name, r.recipe_description, r.date_added, m.meal_id, m.meal_name, " +
		"m.meal_description, c.category_id, c.category_name, " +
		"COALESCE(ROUND(AVG(rt.score), 1), 0) AS overall_score, COALESCE(COUNT(rt.rating_id), 0) AS num_ratings " +
		"FROM recipes r JOIN meals m ON r.meal_id = m.meal_id " +
		"JOIN categories c ON r.category_id = c.category_id " +
		"LEFT JOIN rating rt ON r.recipe_id = rt.recipe_id GROUP BY r.recipe_id, m.meal_id, c.category_id ORDER BY r.recipe_id ASC",
		(error, results) => {
			if (error) {
				return handleDbError(response, error, "Failed to fetch recipes");
			}
			const recipes = results.rows;
			response.status(200).json({ recipes });
		}
	);
};

const getRecipesByRecipeId = (request, response) => {
	const recipe_id = request.params.rid;
	pool.query(
		`SELECT 
		r.recipe_id, 
		r.recipe_name, 
		r.recipe_description, 
		r.prep_time, 
		r.cook_time, 
		r.date_added,
		r.ingredients,
		r.instructions,
		CASE 
			WHEN r.user_id = 0 THEN NULL
			ELSE a.full_name
		END AS full_name,
		m.meal_name, 
		c.category_name,
		COALESCE(ROUND(AVG(rt.score), 1), 0) AS overall_score, 
		COALESCE(COUNT(rt.rating_id), 0) AS num_ratings 
	FROM 
		recipes r 
	JOIN meals m ON r.meal_id = m.meal_id 
	JOIN categories c ON r.category_id = c.category_id 
	LEFT JOIN rating rt ON r.recipe_id = rt.recipe_id
	LEFT JOIN accounts a ON r.user_id = a.user_id
	WHERE 
		r.recipe_id = $1
	GROUP BY 
		r.recipe_id, 
		r.recipe_name, 
		r.recipe_description, 
		r.prep_time, 
		r.cook_time, 
		r.date_added,
		a.full_name,
		m.meal_name, 
		c.category_name;
	`,
		[recipe_id],
		(error, results) => {
			if (error) {
				return handleDbError(
					response,
					error,
					"Failed to fetch recipe by id"
				);
			}
			if (results.rowCount === 0) {
				return response.status(404).json({ message: "Recipe not found" });
			}
			const recipe = results.rows[0];
			response.status(200).json({ recipe });
		}
	);
};

const getRecipesByUserId = (request, response) => {
	const user_id = request.params.uid;
	pool.query(
		`SELECT r.recipe_id, r.recipe_name, r.recipe_description, r.date_added, r.prep_time, r.cook_time, m.meal_id, m.meal_name,
		m.meal_description, c.category_id, c.category_name FROM recipes r 
		JOIN meals m ON m.meal_id = r.meal_id 
		JOIN categories c ON c.category_id = r.category_id 
		WHERE user_id = $1`,
		[user_id],
		(error, results) => {
			if (error) {
				return handleDbError(
					response,
					error,
					"Failed to fetch recipes by user"
				);
			}
			const recipes = results.rows;
			response.status(200).json({ recipes });
		}
	);
};

const addRecipe = (request, response) => {
	if (!request.file) {
		return response
			.status(400)
			.json({ message: "Recipe image is required" });
	}
	// Access uploaded file through req.file
	const newFilename = `${sanitizeFilename(request.body.recipeName)
		.toLowerCase()
		.replaceAll(" ", "_")}.png`;

	// Construct the new file path
	const newFilePath = path.join(path.dirname(request.file.path), newFilename);

	// Rename the file synchronously
	fs.renameSync(request.file.path, newFilePath);

	// Access other form fields through req.body
	const {
		recipeName,
		recipeDescription,
		recipeMealName,
		recipeCategoryName,
		recipePrepTime,
		recipeCookTime,
		recipeIngredients,
		recipeInstructions,
		userId,
	} = request.body;
	const prepTime = recipePrepTime.number + " " + recipePrepTime.unit;
	const cookTime = recipeCookTime.number + " " + recipeCookTime.unit;
	pool.query(
		`WITH meal_cte AS (
			INSERT INTO meals (meal_name)
			SELECT $1::VARCHAR
			WHERE NOT EXISTS (SELECT 1 FROM meals WHERE meal_name = $1)
			RETURNING meal_id
		  ),
		  category_cte AS (
			INSERT INTO categories (category_name)
			SELECT $2::VARCHAR
			WHERE NOT EXISTS (SELECT 1 FROM categories WHERE category_name = $2)
			RETURNING category_id
		  )
		  INSERT INTO recipes (recipe_name, recipe_description, meal_id, category_id, prep_time, cook_time, ingredients, instructions, user_id)
		  VALUES ($3,
			$4, COALESCE((SELECT meal_id FROM meal_cte), (SELECT meal_id FROM meals WHERE meal_name = $1)::integer),
			COALESCE((SELECT category_id FROM category_cte), (SELECT category_id FROM categories WHERE category_name = $2)::integer)
			, $5, $6, $7, $8, $9)`,
		[
			recipeMealName,
			recipeCategoryName,
			recipeName,
			recipeDescription,
			prepTime,
			cookTime,
			recipeIngredients,
			recipeInstructions,
			userId,
		],
		(error, results) => {
			if (error) {
				return handleDbError(response, error, "Failed to add recipe");
			}
			response.status(200).json({ message: "Recipe added successfully" });
		}
	);
};

const deleteRecipe = (request, response) => {
	const recipeId = request.params.rid;
	pool.query(
		`DELETE FROM recipes WHERE recipe_id = $1;`,
		[recipeId],
		(error, results) => {
			if (error) {
				return handleDbError(response, error, "Failed to delete recipe");
			}
			if (results.rowCount === 0) {
				return response.status(404).json({ message: "Recipe not found" });
			}
			response
				.status(200)
				.json({ message: "Recipe deleted successfully" });
		}
	);
};

const getCategories = (request, response) => {
	pool.query(
		"SELECT c.category_id AS id, c.category_name AS name, COUNT(r.recipe_id) AS recipe_count " +
		"FROM categories c JOIN recipes r ON c.category_id = r.category_id " +
		"GROUP BY c.category_id, c.category_name ORDER BY c.category_id ASC;",
		(error, results) => {
			if (error) {
				return handleDbError(response, error, "Failed to fetch categories");
			}
			const categories = results.rows;
			response.status(200).json({ categories });
		}
	);
};

const getMeals = (request, response) => {
	pool.query(
		"SELECT m.meal_id AS id, m.meal_name AS name, m.meal_description AS description, COUNT(r.recipe_id) AS recipe_count " +
		"FROM meals m JOIN recipes r ON m.meal_id = r.meal_id " +
		"GROUP BY m.meal_id, m.meal_name ORDER BY m.meal_id ASC;",
		(error, results) => {
			if (error) {
				return handleDbError(response, error, "Failed to fetch meals");
			}
			const meals = results.rows;
			response.status(200).json({ meals });
		}
	);
};

const addItemsToWishlist = (request, response) => {
	const { user_id, recipe_id } = request.body;
	pool.query(
		"INSERT INTO wishlist (user_id, recipe_id) VALUES ($1, $2) ON CONFLICT (user_id, recipe_id) DO NOTHING",
		[user_id, recipe_id],
		(error, results) => {
			if (error) {
				return handleDbError(
					response,
					error,
					"Failed to add wishlist item"
				);
			}
			if (results.rowCount === 0) {
				response.status(200).json({
					message: `Item already exists in wishlist with user_id = ${user_id} and recipe_id = ${recipe_id}`,
				});
			} else {
				response.status(200).json({
					message: `Item has been added to wishlist with user_id = ${user_id} and recipe_id = ${recipe_id}`,
				});
			}
		}
	);
};
const getWishlistByUserId = (request, response) => {
	const user_id = request.params.uid;
	pool.query(
		"SELECT recipe_id FROM wishlist WHERE user_id = $1",
		[user_id],
		(error, results) => {
			if (error) {
				return handleDbError(
					response,
					error,
					"Failed to fetch wishlist"
				);
			}
			response.status(200).json({
				wishlist: results.rows,
			});
		}
	);
};
const deleteWishlistItems = (request, response) => {
	const user_id = request.params.uid;
	const recipe_id = request.params.rid;

	pool.query(
		"DELETE FROM wishlist WHERE user_id = $1 AND recipe_id = $2 ",
		[user_id, recipe_id],
		(error, results) => {
			if (error) {
				return handleDbError(
					response,
					error,
					"Failed to delete wishlist item"
				);
			}
			response.status(200).json({
				message: `Item with user_id = ${user_id} and recipe_id = ${recipe_id} has been deleted successfully`,
			});
		}
	);
};
const addRating = (request, response) => {
	const user_id = Number.parseInt(request.params.uid, 10);
	const recipe_id = Number.parseInt(request.params.rid, 10);
	const { score, review } = request.body;
	const ratingScore = Number.parseInt(score, 10);

	if (!Number.isInteger(user_id) || user_id <= 0) {
		return response.status(400).json({ message: "Valid user_id is required" });
	}

	if (!Number.isInteger(recipe_id) || recipe_id <= 0) {
		return response
			.status(400)
			.json({ message: "Valid recipe_id is required" });
	}

	if (
		!Number.isInteger(ratingScore) ||
		ratingScore < 1 ||
		ratingScore > 5
	) {
		return response
			.status(400)
			.json({ message: "Rating score must be between 1 and 5" });
	}

	pool.query(
		`INSERT INTO rating (user_id, recipe_id, score, review) VALUES ($1, $2, $3, $4) 
		ON CONFLICT (user_id, recipe_id)
		DO UPDATE SET score = EXCLUDED.score, review = EXCLUDED.review, date_added = CURRENT_TIMESTAMP;`,
		[user_id, recipe_id, ratingScore, review || ""],
		(error, results) => {
			if (error) {
				return handleDbError(response, error, "Failed to add rating");
			}
			response.status(200).json({
				message: `Rating with user_id = ${user_id}, recipe_id = ${recipe_id} has been added successfully.`,
			});
		}
	);
};
const getRatingsByUserId = (request, response) => {
	const user_id = request.params.uid;
	pool.query(
		`SELECT rt.rating_id, rt.recipe_id, r.recipe_name, rt.score, rt.review, rt.date_added FROM rating rt
			JOIN recipes r ON rt.recipe_id = r.recipe_id WHERE rt.user_id = $1`,
		[user_id],
		(error, results) => {
			if (error) {
				return handleDbError(
					response,
					error,
					"Failed to fetch ratings"
				);
			}
			const ratings = results.rows;
			response.status(200).json({
				ratings,
			});
		}
	);
};
const getReviewsByRecipeId = (request, response) => {
	const recipe_id = request.params.rid;
	pool.query(
		`SELECT rt.rating_id, rt.score, rt.review, rt.date_added, a.full_name 
		FROM rating rt 
		JOIN recipes r ON rt.recipe_id = r.recipe_id JOIN accounts a ON rt.user_id = a.user_id
		WHERE r.recipe_id = $1 ORDER BY rt.date_added DESC;`,
		[recipe_id],
		(error, results) => {
			if (error) {
				return handleDbError(
					response,
					error,
					"Failed to fetch reviews"
				);
			}
			const reviews = results.rows;
			response.status(200).json({
				reviews,
			});
		}
	);
};
module.exports = {
	getUsersLogin,
	createUser,
	updateUser,
	updatePassword,
	getUserByJWT,
	getRecipes,
	getRecipesByRecipeId,
	getRecipesByUserId,
	addRecipe,
	deleteRecipe,
	getCategories,
	getMeals,
	addItemsToWishlist,
	getWishlistByUserId,
	deleteWishlistItems,
	addRating,
	getRatingsByUserId,
	getReviewsByRecipeId,
	getDatabaseHealth,
};
