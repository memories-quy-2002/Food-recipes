const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const cors = require("cors");
const db = require("./queries");
const rateLimit = require('express-rate-limit')
const storage = multer.diskStorage({
	destination: "../client/assets/images/", // Save files to this directory
	filename: (req, file, cb) => {
		cb(null, file.originalname);
	},
});
const upload = multer({ storage });

const PORT = 4000;
const app = express();

var limiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 1000,
});

app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/uploads", express.static("../client/assets/images/"));
app.use(
	cors({
		origin: "http://localhost:5173",
		credentials: true,
	})
);
app.get("/recipe/", db.getRecipes);
app.get("/recipe/:rid", db.getRecipesByRecipeId);
app.get("/recipe/user/:uid", db.getRecipesByUserId);
app.get("/category/", db.getCategories);
app.get("/meal/", db.getMeals);
app.get("/wishlist/:uid", db.getWishlistByUserId);
app.get("/rating/:uid", db.getRatingsByUserId);
app.get("/review/:rid", db.getReviewsByRecipeId);
app.post("/recipe/add", upload.single("recipeImage"), db.addRecipe);
app.post("/wishlist/", db.addItemsToWishlist);
app.post("/account/jwt", db.getUserByJWT);
app.post("/account/login", db.getUsersLogin);
app.post("/account/signup", db.createUser);
app.post("/rating/:uid/:rid", db.addRating);
app.put("/account/users/update/:uid", db.updateUser);
app.put("/account/users/password/:uid", db.updatePassword);
app.delete("/recipe/delete/:rid", db.deleteRecipe);
app.delete("/wishlist/:uid/:rid", db.deleteWishlistItems);

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}.`);
});
app.get('/', (req, res) => {
	res.send("Hello World from Express");
});

