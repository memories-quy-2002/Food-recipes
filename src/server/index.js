const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./queries");

const PORT = process.env.PORT || process.env.REACT_APP_PORT;

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
app.get("/category/", db.getCategories);
app.get("/meal/", db.getMeals);
app.get("/wishlist/:id", db.getWishlistbyUser);
app.get("/rating/:uid", db.getRatingsById);
app.post("/wishlist/", db.addItemstoWishlist);
app.post("/account/jwt", db.getUserByJWT);
app.post("/account/login", db.getUsersLogin);
app.post("/account/signup", db.createUser);
app.post("/rating/:uid/:rid", db.addRating);
app.put("/account/users/:id", db.updateUser);
app.put("/account/users/password/:uid", db.updatePassword);
app.delete("/account/users/:id", db.deleteUser);
app.delete("/wishlist/:uid/:rid", db.deleteWishlistItems);

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}.`);
});
