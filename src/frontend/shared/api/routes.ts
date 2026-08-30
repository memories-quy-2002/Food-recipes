import type { KitchenScope } from "@/features/households/householdScope";

export type ApiRouteId = number | string;

export type PantryApiRoutes = {
	pantry: string;
	pantryItem: (pantryId: ApiRouteId) => string;
	pantryFromShoppingList: string;
};

type ApiRoutes = {
	recipes: string;
	homeFeed: string;
	userHomeFeed: string;
	recipe: (recipeId: ApiRouteId) => string;
	recipeMetadata: (recipeId: ApiRouteId) => string;
	suggestions: string;
	userSuggestions: string;
	userRecipes: string;
	userRecipeDrafts: string;
	recipeImportPreview: string;
	recipeImportDrafts: string;
	recipeIngredients: (recipeId: ApiRouteId) => string;
	recipeNutrition: (recipeId: ApiRouteId) => string;
	recipeDietaryTags: (recipeId: ApiRouteId) => string;
	recipePublish: (recipeId: ApiRouteId) => string;
	recipeArchive: (recipeId: ApiRouteId) => string;
	recipeRestore: (recipeId: ApiRouteId) => string;
	categories: string;
	meals: string;
	userWishlist: string;
	userWishlistItem: (recipeId: ApiRouteId) => string;
	userCollections: string;
	userCollection: (collectionId: ApiRouteId) => string;
	userCollectionRecipes: (collectionId: ApiRouteId) => string;
	userCollectionRecipe: (
		collectionId: ApiRouteId,
		recipeId: ApiRouteId,
	) => string;
	userRecipeNote: (recipeId: ApiRouteId) => string;
	pantry: string;
	pantryItem: (pantryId: ApiRouteId) => string;
	pantryFromShoppingList: string;
	userRatings: string;
	userRecipeRating: (recipeId: ApiRouteId) => string;
	userRecipeRatingDelete: (recipeId: ApiRouteId) => string;
	recipeReviews: (recipeId: ApiRouteId) => string;
	authToken: string;
	authLogin: string;
	authSignup: string;
	authRefresh: string;
	authLogout: string;
	userProfile: string;
	userFoodPreferences: string;
	userRecommendationNotInterested: (recipeId: ApiRouteId) => string;
	userLeftovers: string;
	householdLeftovers: (householdId: ApiRouteId) => string;
	userPassword: string;
	mealPlans: string;
	mealPlanGeneratePreview: string;
	mealPlanFromPreview: string;
	mealPlanTemplates: string;
	mealPlanTemplateApply: (templateId: ApiRouteId) => string;
	recurringMealRules: string;
	recurringMealRule: (ruleId: ApiRouteId) => string;
	mealPlan: (planId: ApiRouteId) => string;
	mealPlanItems: (planId: ApiRouteId) => string;
	mealPlanItem: (planId: ApiRouteId, itemId: ApiRouteId) => string;
	shoppingList: string;
	shoppingListItems: string;
	shoppingListItem: (itemId: ApiRouteId) => string;
	shoppingListFromRecipe: string;
	shoppingListPrepare: string;
	shoppingListCompleted: string;
	cookingHistory: string;
	cookingSession: string;
	cookingSessionItem: (sessionId: ApiRouteId) => string;
	cookingSessionComplete: (sessionId: ApiRouteId) => string;
	cookingJournal: (historyId: ApiRouteId) => string;
	journalPhotoUpload: string;
	databaseHealth: string;
	serverHealth: string;
};

const apiRoutes: ApiRoutes = {
	recipes: "/recipes",
	homeFeed: "/home-feed",
	userHomeFeed: "/users/me/home-feed",
	recipe: (recipeId) => `/recipes/${recipeId}`,
	recipeMetadata: (recipeId) => `/recipes/${recipeId}/metadata`,
	suggestions: "/suggestions",
	userSuggestions: "/users/me/suggestions",
	userRecipes: "/users/me/recipes",
	userRecipeDrafts: "/users/me/recipes/drafts",
	recipeImportPreview: "/users/me/recipe-imports/preview",
	recipeImportDrafts: "/users/me/recipe-imports/drafts",
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
	userCollections: "/users/me/collections",
	userCollection: (collectionId) => `/users/me/collections/${collectionId}`,
	userCollectionRecipes: (collectionId) =>
		`/users/me/collections/${collectionId}/recipes`,
	userCollectionRecipe: (collectionId, recipeId) =>
		`/users/me/collections/${collectionId}/recipes/${recipeId}`,
	userRecipeNote: (recipeId) => `/users/me/recipes/${recipeId}/note`,
	pantry: "/users/me/pantry",
	pantryItem: (pantryId) => `/users/me/pantry/${pantryId}`,
	pantryFromShoppingList: "/users/me/pantry/from-shopping-list",
	userRatings: "/users/me/ratings",
	userRecipeRating: (recipeId) => `/recipes/${recipeId}/rating`,
	userRecipeRatingDelete: (recipeId) => `/recipes/${recipeId}/rating`,
	recipeReviews: (recipeId) => `/recipes/${recipeId}/reviews`,
	authToken: "/auth/token",
	authLogin: "/auth/login",
	authSignup: "/auth/signup",
	authRefresh: "/auth/refresh",
	authLogout: "/auth/logout",
	userProfile: "/users/me/profile",
	userFoodPreferences: "/users/me/food-preferences",
	userRecommendationNotInterested: (recipeId) => `/users/me/recommendations/not-interested/${recipeId}`,
	userLeftovers: "/users/me/leftovers",
	householdLeftovers: (householdId) => `/households/${householdId}/leftovers`,
	userPassword: "/users/me/password",
	mealPlans: "/users/me/meal-plans",
	mealPlanGeneratePreview: "/users/me/meal-plans/generate-preview",
	mealPlanFromPreview: "/users/me/meal-plans/from-preview",
	mealPlanTemplates: "/users/me/meal-plan-templates",
	mealPlanTemplateApply: (templateId) => `/users/me/meal-plan-templates/${templateId}/apply`,
	recurringMealRules: "/users/me/recurring-meal-rules",
	recurringMealRule: (ruleId) => `/users/me/recurring-meal-rules/${ruleId}`,
	mealPlan: (planId) => `/users/me/meal-plans/${planId}`,
	mealPlanItems: (planId) => `/users/me/meal-plans/${planId}/items`,
	mealPlanItem: (planId, itemId) =>
		`/users/me/meal-plans/${planId}/items/${itemId}`,
	shoppingList: "/users/me/shopping-list",
	shoppingListItems: "/users/me/shopping-list/items",
	shoppingListItem: (itemId) => `/users/me/shopping-list/items/${itemId}`,
	shoppingListFromRecipe: "/users/me/shopping-list/from-recipe",
	shoppingListPrepare: "/users/me/shopping-list/prepare",
	shoppingListCompleted: "/users/me/shopping-list/completed",
	cookingHistory: "/users/me/cooking-history",
	cookingSession: "/users/me/cooking-session",
	cookingSessionItem: (sessionId) =>
		`/users/me/cooking-session/${sessionId}`,
	cookingSessionComplete: (sessionId) =>
		`/users/me/cooking-session/${sessionId}/complete`,
	cookingJournal: (historyId) => `/users/me/cooking-history/${historyId}/journal`,
	journalPhotoUpload: "/media/journal-photo/upload-url",
	databaseHealth: "/health/ready",
	serverHealth: "/health/live",
};

export const createPantryRoutes = (scope: KitchenScope): PantryApiRoutes => {
	if (scope.kind === "personal") {
		return {
			pantry: apiRoutes.pantry,
			pantryItem: apiRoutes.pantryItem,
			pantryFromShoppingList: apiRoutes.pantryFromShoppingList,
		};
	}

	const pantry = `/households/${scope.householdId}/pantry`;
	return {
		pantry,
		pantryItem: (pantryId) => `${pantry}/${pantryId}`,
		pantryFromShoppingList: `${pantry}/from-shopping-list`,
	};
};

export const getUserRecipeRatingRoute = (recipeId: ApiRouteId): string =>
	apiRoutes.userRecipeRating(recipeId);

export { apiRoutes };
