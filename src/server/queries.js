const pg = require("pg");
const utils = require("./utils");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const Pool = pg.Pool;
const pool = new Pool({
	user: process.env.REACT_APP_DATABASE_USER,
	host: process.env.REACT_APP_DATABASE_HOST,
	database: process.env.REACT_APP_DATABASE_NAME,
	password: process.env.REACT_APP_DATABASE_PASSWORD,
	port: process.env.REACT_APP_DATABASE_PORT,
});

const secretKey = process.env.REACT_APP_SECRET_KEY;

pool.connect((err) => {
	if (err) {
		console.error("Error connecting to the PostgreSQL database", err);
	} else {
		console.log("Connected to PostgreSQL database");
	}
});

const getUsersLogin = (request, response) => {
	const { email, password } = request.body;
	pool.query(
		"SELECT * FROM accounts WHERE email=$1",
		[email],
		(error, results) => {
			if (error) {
				throw error;
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
							throw error;
						}
						const token = jwt.sign(
							{
								user_id: user.user_id,
								email: user.email,
							},
							secretKey,
							{ expiresIn: "1h" }
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
	try {
		const payload = jwt.verify(token, secretKey);
		const currentTime = Date.now();
		if (payload.exp * 1000 <= currentTime) {
			response.status(401).json({ message: "JWT Expired" });
			return;
		}
		pool.query(
			"SELECT * FROM accounts WHERE user_id = $1",
			[payload.user_id],
			(errors, results) => {
				if (results.rowCount > 0) {
					const user = results.rows[0];
					response
						.status(200)
						.json({ user, message: "JWT Received" });
				}
			}
		);
	} catch (err) {
		console.error("Token verification failed: ", err);
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
					throw error;
				}
				const user = results.rows[0];
				const token = jwt.sign(
					{ user_id: user.user_id, email: user.email },
					secretKey,
					{
						expiresIn: "1h",
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
	const user_id = parseInt(request.params.id);
	const { name, email } = request.body;
	pool.query(
		"UPDATE accounts SET full_name = $1, email = $2 WHERE user_id = $3",
		[name.first + " " + name.last, email, user_id],
		(error, results) => {
			if (error) {
				throw error;
			}
			response.status(200).send(`User modified with user_id: ${user_id}`);
		}
	);
};

const deleteUser = (request, response) => {
	const user_id = request.params.id;
	pool.query(
		"DELETE FROM accounts WHERE user_id = $1",
		[user_id],
		(error, results) => {
			if (error) {
				throw error;
			}
			response.status(200).send(`User deleted with user_id: ${user_id}`);
		}
	);
};

const getRecipes = (request, response) => {
	pool.query(
		"SELECT r.recipe_id, r.recipe_name, r.recipe_description, m.meal_name, c.category_name " +
			"FROM recipes r JOIN meals m ON r.meal_id = m.meal_id " +
			"JOIN categories c ON r.category_id = c.category_id ",
		(error, results) => {
			if (error) {
				throw error;
			}
			const recipes = results.rows;
			response.status(200).json({ recipes });
		}
	);
};

const getRecipesById = (request, response) => {
	const recipe_id = request.params.id;
	pool.query(
		"SELECT r.recipe_id, r.recipe_name, r.recipe_description, r.prep_time, r.cook_time, m.meal_name, c.category_name " +
			"FROM recipes r JOIN meals m ON r.meal_id = m.meal_id " +
			"JOIN categories c ON r.category_id = c.category_id " +
			"WHERE r.recipe_id = $1 ",
		[recipe_id],
		(error, results) => {
			if (error) {
				throw error;
			}
			const recipe = results.rows[0];
			response.status(200).json({ recipe });
		}
	);
};
const getCategories = (request, response) => {
	pool.query("SELECT * FROM categories", (error, results) => {
		if (error) {
			throw error;
		}
		const categories = results.rows;
		response.status(200).json({ categories });
	});
};

const getMeals = (request, response) => {
	pool.query("SELECT * FROM meals", (error, results) => {
		if (error) {
			throw error;
		}
		const meals = results.rows;
		response.status(200).json({ meals });
	});
};
module.exports = {
	getUsersLogin,
	createUser,
	updateUser,
	deleteUser,
	getUserByJWT,
	getRecipes,
	getRecipesById,
	getCategories,
	getMeals,
};
