const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./queries");

const PORT = process.env.PORT || 4000;

const app = express();
app.use(
	cors({
		origin: "http://localhost:3000",
		credentials: true,
	})
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.get("/recipe/", db.getRecipes);
app.get("/recipe/:id", db.getRecipesById);
app.post("/account/jwt", db.getUserByJWT);
app.post("/account/login", db.getUsersLogin);
app.post("/account/signup", db.createUser);
app.put("/account/users/:id", db.updateUser);
app.delete("/account/users/:id", db.deleteUser);

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}.`);
});
