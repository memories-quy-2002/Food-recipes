const apiRoutes = {
	recipes: "/recipes",
	recipe: (recipeId) => `/recipes/${recipeId}`,
	userRecipes: "/users/me/recipes",
	userRecipeDrafts: "/users/me/recipes/drafts",
	recipeIngredients: (recipeId) => `/recipes/${recipeId}/ingredients`,
	recipeNutrition: (recipeId) => `/recipes/${recipeId}/nutrition`,
	recipeDietaryTags: (recipeId) => `/recipes/${recipeId}/dietary-tags`,
	recipePublish: (recipeId) => `/recipes/${recipeId}/publish`,
	recipeArchive: (recipeId) => `/recipes/${recipeId}/archive`,
	recipeRestore: (recipeId) => `/recipes/${recipeId}/restore`,
	categories: "/categories",
	meals: "/meals",
	userWishlist: "/users/me/wishlist",
	userWishlistItem: (recipeId) => `/users/me/wishlist/${recipeId}`,
	userRatings: "/users/me/ratings",
	userRecipeRating: (recipeId) => `/recipes/${recipeId}/rating`,
	userRecipeRatingDelete: (recipeId) => `/recipes/${recipeId}/rating`,
	recipeReviews: (recipeId) => `/recipes/${recipeId}/reviews`,
	authToken: "/auth/token",
	authLogin: "/auth/login",
	authSignup: "/auth/signup",
	authRefresh: "/auth/refresh",
	userProfile: "/users/me/profile",
	userPassword: "/users/me/password",
	databaseHealth: "/health/ready",
	serverHealth: "/health/live",
};

export const getUserRecipeRatingRoute = (recipeId) =>
	apiRoutes.userRecipeRating(recipeId);

export { apiRoutes };
