const apiRoutes = {
	recipes: "/recipes",
	recipe: (recipeId) => `/recipes/${recipeId}`,
	userRecipes: "/users/me/recipes",
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
	mealPlans: "/users/me/meal-plans",
	mealPlan: (planId) => `/users/me/meal-plans/${planId}`,
	mealPlanItems: (planId) => `/users/me/meal-plans/${planId}/items`,
	mealPlanItem: (planId, itemId) => `/users/me/meal-plans/${planId}/items/${itemId}`,
	databaseHealth: "/health/ready",
	serverHealth: "/health/live",
};

export const getUserRecipeRatingRoute = (recipeId) =>
	apiRoutes.userRecipeRating(recipeId);

export { apiRoutes };
