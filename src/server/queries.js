const pg = require("pg");
const utils = require("./utils");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const sanitizeFilename = require("sanitize-filename");
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
	try {
		const payload = jwt.verify(token, secretKey);
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
					throw error;
				}
				const user = results.rows[0];
				const token = jwt.sign(
					{ user_id: user.user_id, email: user.email },
					secretKey,
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
				throw error;
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
			"SELECT * FROM accounts WHERE user_id = $1",
			[user_id]
		);

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
				console.error("Error executing query", error);
				return;
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
				throw error;
			}
			const recipe = results.rows[0];
			console.log(recipe);
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
				console.error("Error executing query", error);
				return;
			}
			const recipes = results.rows;
			response.status(200).json({ recipes });
		}
	);
};

const addRecipe = (request, response) => {
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
	console.log(request.body);
	const prepTime = recipePrepTime.number + " " + recipePrepTime.unit;
	const cookTime = recipeCookTime.number + " " + recipeCookTime.unit;
	console.log({ prepTime, cookTime });
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
				console.error("Error executing query", error);
				return;
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
				throw error;
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
				throw error;
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
				throw error;
			}
			const meals = results.rows;
			response.status(200).json({ meals });
		}
	);
};

const addItemstoWishlist = (request, response) => {
	const { user_id, recipe_id } = request.body;
	pool.query(
		"INSERT INTO wishlist (user_id, recipe_id) VALUES ($1, $2) ON CONFLICT (user_id, recipe_id) DO NOTHING",
		[user_id, recipe_id],
		(error, results) => {
			if (error) {
				throw error;
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
const getWishlistbyUserId = (request, response) => {
	const user_id = request.params.uid;
	pool.query(
		"SELECT recipe_id FROM wishlist WHERE user_id = $1",
		[user_id],
		(error, results) => {
			if (error) {
				throw error;
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
				throw error;
			}
			response.status(200).json({
				message: `Item with user_id = ${user_id} and recipe_id = ${recipe_id} has been deleted successfully`,
			});
		}
	);
};
const addRating = (request, response) => {
	const user_id = request.params.uid;
	const recipe_id = request.params.rid;
	const { score, review } = request.body;
	pool.query(
		`INSERT INTO rating (user_id, recipe_id, score, review) VALUES ($1, $2, $3, $4) 
		ON CONFLICT (user_id, recipe_id)
		DO UPDATE SET score = EXCLUDED.score, review = EXCLUDED.review;`,
		[user_id, recipe_id, score, review],
		(error, results) => {
			if (error) {
				throw error;
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
				throw error;
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
				throw error;
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
	addItemstoWishlist,
	getWishlistbyUserId,
	deleteWishlistItems,
	addRating,
	getRatingsByUserId,
	getReviewsByRecipeId,
};
