import { apiTargets, getApiTarget } from "./config";

export class ApiCompatibilityError extends Error {
	constructor(routeName, target, reason) {
		super(
			`Route "${routeName}" is not available in ${target} API mode. ${reason}`
		);
		this.name = "ApiCompatibilityError";
		this.routeName = routeName;
		this.target = target;
	}
}

const routeDefinitions = {
	recipes: { legacy: () => "/recipes", nest: () => "/recipes" },
	recipe: {
		legacy: (recipeId) => `/recipes/${recipeId}`,
		nest: (recipeId) => `/recipes/${recipeId}`,
	},
	userRecipes: {
		legacy: (userId) => `/users/${userId}/recipes`,
		nest: () => "/users/me/recipes",
	},
	categories: {
		legacy: () => "/categories",
		nest: null,
		reason: "NestJS does not expose a categories controller yet; keep this journey on Express.",
	},
	meals: {
		legacy: () => "/meals",
		nest: null,
		reason: "NestJS does not expose a meals controller yet; keep this journey on Express.",
	},
	userWishlist: {
		legacy: (userId) => `/users/${userId}/wishlist`,
		nest: () => "/users/me/wishlist",
	},
	userWishlistItem: {
		legacy: (userId, recipeId) => `/users/${userId}/wishlist/${recipeId}`,
		nest: (_userId, recipeId) => `/users/me/wishlist/${recipeId}`,
	},
	userRatings: {
		legacy: (userId) => `/users/${userId}/ratings`,
		nest: () => "/users/me/ratings",
	},
	userRecipeRating: {
		legacy: (userId, recipeId) => `/users/${userId}/ratings/${recipeId}`,
		nest: (_userId, recipeId) => `/recipes/${recipeId}/rating`,
	},
	userRecipeRatingDelete: {
		legacy: null,
		nest: (_userId, recipeId) => `/recipes/${recipeId}/rating`,
		reason: "The legacy Express API does not expose an ownership-preserving rating delete endpoint.",
	},
	recipeReviews: {
		legacy: (recipeId) => `/recipes/${recipeId}/reviews`,
		nest: (recipeId) => `/recipes/${recipeId}/reviews`,
	},
	authToken: {
		legacy: () => "/auth/token",
		nest: () => "/auth/token",
		reason: "NestJS keeps this body-token endpoint only as a compatibility bridge; new protected calls use Bearer JWTs.",
	},
	authLogin: { legacy: () => "/auth/login", nest: () => "/auth/login" },
	authSignup: { legacy: () => "/auth/signup", nest: () => "/auth/signup" },
	userProfile: {
		legacy: (userId) => `/users/${userId}/profile`,
		nest: () => "/users/me/profile",
	},
	userPassword: {
		legacy: (userId) => `/users/${userId}/password`,
		nest: () => "/users/me/password",
	},
	databaseHealth: {
		legacy: () => "/health/database",
		nest: () => "/health/ready",
	},
	serverHealth: {
		legacy: () => "/",
		nest: () => "/health/live",
	},
};

export const getApiRoute = (routeName, target, ...args) => {
	const definition = routeDefinitions[routeName];
	if (!definition) throw new Error(`Unknown API route: ${routeName}`);

	const route = definition[target];
	if (!route) {
		throw new ApiCompatibilityError(
			routeName,
			target,
			definition.reason || "No compatible route has been implemented."
		);
	}

	return route(...args);
};

export const createApiRoutes = (target = getApiTarget()) => {
	const routes = {};

	Object.entries(routeDefinitions).forEach(([routeName, definition]) => {
		const route = (...args) => getApiRoute(routeName, target, ...args);
		const isParameterized =
			definition.legacy?.length > 0 || definition.nest?.length > 0;

		if (!definition[target]) {
			Object.defineProperty(routes, routeName, {
				configurable: false,
				enumerable: true,
				get: () => {
					throw new ApiCompatibilityError(
						routeName,
						target,
						definition.reason ||
								"No compatible route has been implemented."
					);
				},
			});
			return;
		}

		routes[routeName] = isParameterized ? route : route();
	});

	return routes;
};

export const apiRouteCompatibility = Object.freeze(
	Object.fromEntries(
		Object.entries(routeDefinitions).map(([routeName, definition]) => [
			routeName,
			{
				legacy: Boolean(definition.legacy),
				nest: Boolean(definition.nest),
				reason: definition.reason || null,
			},
		])
	)
);

export const apiRoutes = createApiRoutes(getApiTarget());

export { apiTargets };
