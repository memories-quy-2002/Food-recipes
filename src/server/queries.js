const pg = require("pg");
const utils = require("./utils");
const jwt = require("jsonwebtoken");
const Pool = pg.Pool;
const pool = new Pool({
	user: "postgres",
	host: "localhost",
	database: "mydb",
	password: "123456",
	port: 5432,
});

pool.connect((err) => {
	if (err) {
		console.error("Error connecting to the PostgreSQL database", err);
	} else {
		console.log("Connected to PostgreSQL database");
	}
});

const getUsersLogIn = (request, response) => {
	const { email, password } = request.body;
	pool.query(
		"SELECT * FROM accounts WHERE email=$1",
		[email],
		(error, results) => {
			const user = results.rows[0];
			if (error) {
				throw error;
			}
			if (results.rows.length > 0) {
				(async () => {
					const match = await utils.checkPassword(
						password,
						user.password
					);
					if (match) {
						pool.query(
							"UPDATE accounts SET last_login=CURRENT_TIMESTAMP WHERE user_id=$1",
							[user.user_id],
							(error, results) => {
								if (error) {
									throw error;
								}
								const token = jwt.sign(
									{ userId: user.id, name: user.full_name },
									"secret",
									{ expiresIn: "1h" }
								);
								console.log("Logged in Successfully!");
								response.status(200).json({
									token,
									message: "Logged in!",
								});
							}
						);
					} else {
						response
							.status(401)
							.json({ message: "The password is incorrect!" });
					}
				})();
			} else {
				response.status(401).json({
					message: "The email you entered is not signed up!",
				});
			}
		}
	);
};

const createUser = (request, response) => {
	const { name, email, password } = request.body;

	(async () => {
		const hashedPassword = await utils.hashPassword(password);
		pool.query(
			"INSERT INTO accounts (full_name, email, password, created_on, last_login) " +
				"VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
			[name.first + " " + name.last, email, hashedPassword],
			(error, results) => {
				if (error) {
					throw error;
				}
				console.log("Create user Successfully!");
				response.status(200).json({ message: "Signed up!" });
			}
		);
	})();
};

const updateUser = (request, response) => {
	const id = parseInt(request.params.id);
	const { name, email } = request.body;
	pool.query(
		"UPDATE accounts SET full_name = $1, email = $2 WHERE user_id = $3",
		[name.first + " " + name.last, email, id],
		(error, results) => {
			if (error) {
				throw error;
			}
			response.status(200).send(`User modified with ID: ${id}`);
		}
	);
};

const getUserByJWT = (request, response) => {
	const token = request.body.token;
	const secretKey = "secret";
	try {
		const payload = jwt.verify(token, secretKey);
		console.log(payload);
		response.status(200).json({ message: "JWT Received" });
	} catch (err) {
		console.error("Token verification failed: ", err);
	}
};

const deleteUser = (request, response) => {
	const id = request.params.id;
	pool.query(
		"DELETE FROM accounts WHERE user_id = $1",
		[id],
		(error, results) => {
			if (error) {
				throw error;
			}
			response.status(200).send(`User deleted with ID: ${id}`);
		}
	);
};

module.exports = {
	getUsersLogIn,
	createUser,
	updateUser,
	deleteUser,
	getUserByJWT,
};
