export const apiRoutes = {
	recipes: "/recipes",
	recipe: (recipeId) => `/recipes/${recipeId}`,
	userRecipes: (userId) => `/users/${userId}/recipes`,
	categories: "/categories",
	meals: "/meals",
	userWishlist: (userId) => `/users/${userId}/wishlist`,
	userWishlistItem: (userId, recipeId) => `/users/${userId}/wishlist/${recipeId}`,
	userRatings: (userId) => `/users/${userId}/ratings`,
	userRecipeRating: (userId, recipeId) =>
		`/users/${userId}/ratings/${recipeId}`,
	recipeReviews: (recipeId) => `/recipes/${recipeId}/reviews`,
	authToken: "/auth/token",
	authLogin: "/auth/login",
	authSignup: "/auth/signup",
	userProfile: (userId) => `/users/${userId}/profile`,
	userPassword: (userId) => `/users/${userId}/password`,
	databaseHealth: "/health/database",
};
