const db = require("./queries");

const registerRoutes = (app) => {
	const routeGroups = [
		{
			handler: db.getRecipes,
			routes: [{ method: "get", path: "/recipes" }],
		},
		{
			handler: db.getRecipesByRecipeId,
			routes: [{ method: "get", path: "/recipes/:rid" }],
		},
		{
			handler: db.getRecipesByUserId,
			routes: [{ method: "get", path: "/users/:uid/recipes" }],
		},
		{
			handler: db.addRecipe,
			routes: [{ method: "post", path: "/recipes" }],
		},
		{
			handler: db.deleteRecipe,
			routes: [{ method: "delete", path: "/recipes/:rid" }],
		},
		{
			handler: db.getCategories,
			routes: [{ method: "get", path: "/categories" }],
		},
		{
			handler: db.getMeals,
			routes: [{ method: "get", path: "/meals" }],
		},
		{
			handler: db.getWishlistByUserId,
			routes: [{ method: "get", path: "/users/:uid/wishlist" }],
		},
		{
			handler: db.addItemsToWishlist,
			routes: [{ method: "post", path: "/users/:uid/wishlist" }],
		},
		{
			handler: db.deleteWishlistItems,
			routes: [{ method: "delete", path: "/users/:uid/wishlist/:rid" }],
		},
		{
			handler: db.getRatingsByUserId,
			routes: [{ method: "get", path: "/users/:uid/ratings" }],
		},
		{
			handler: db.addRating,
			routes: [{ method: "put", path: "/users/:uid/ratings/:rid" }],
		},
		{
			handler: db.getReviewsByRecipeId,
			routes: [{ method: "get", path: "/recipes/:rid/reviews" }],
		},
		{
			handler: db.getUserByJWT,
			routes: [{ method: "post", path: "/auth/token" }],
		},
		{
			handler: db.getUsersLogin,
			routes: [{ method: "post", path: "/auth/login" }],
		},
		{
			handler: db.createUser,
			routes: [{ method: "post", path: "/auth/signup" }],
		},
		{
			handler: db.updateUser,
			routes: [{ method: "put", path: "/users/:uid/profile" }],
		},
		{
			handler: db.updatePassword,
			routes: [{ method: "put", path: "/users/:uid/password" }],
		},
		{
			handler: db.getDatabaseHealth,
			routes: [{ method: "get", path: "/health/database" }],
		},
	];

	routeGroups.forEach(({ routes, handler }) => {
		routes.forEach(({ method, path }) => {
			app[method](path, handler);
		});
	});
};

module.exports = {
	registerRoutes,
};
