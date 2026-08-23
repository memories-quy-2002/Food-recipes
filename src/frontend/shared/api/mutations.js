import { apiTargets } from "./config";

const isNestTarget = (target) => target === apiTargets.NEST;

const findCatalogId = (items, name, label) => {
	const normalizedName = String(name || "").trim().toLowerCase();
	const match = items.find((item) => {
		const itemName = item.name ?? item.category_name ?? item.meal_name;
		return String(itemName || "").trim().toLowerCase() === normalizedName;
	});
	const id = Number(
		match?.id ?? match?.category_id ?? match?.meal_id
	);

	if (!Number.isInteger(id) || id < 1) {
		throw new Error(`Nest recipe creation requires a known ${label} ID.`);
	}

	return id;
};

const toMinutes = (time) => {
	const unitsInMinutes = {
		days: 24 * 60,
		hours: 60,
		minutes: 1,
		seconds: 1 / 60,
	};
	const value = Number(time?.number);
	const multiplier = unitsInMinutes[time?.unit];

	if (!Number.isFinite(value) || !multiplier) {
		throw new Error("Nest recipe creation requires valid cooking times.");
	}

	return Math.max(1, Math.ceil(value * multiplier));
};

export const serializeWishlistPayload = (target, userId, recipeId) =>
	isNestTarget(target)
		? { recipeId }
		: { user_id: userId, recipe_id: recipeId };

export const serializeCreateRecipePayload = (
	target,
	{ recipe, categories, meals, imageUrl }
) => {
	if (!isNestTarget(target)) {
		return {
			...recipe,
			recipeImage: undefined,
			imageUrl,
		};
	}

	return {
		name: recipe.recipeName.trim(),
		description: recipe.recipeDescription,
		mealId: findCatalogId(meals, recipe.recipeMealName, "meal"),
		categoryId: findCatalogId(
			categories,
			recipe.recipeCategoryName,
			"category"
		),
		prepTimeMinutes: toMinutes(recipe.recipePrepTime),
		cookTimeMinutes: toMinutes(recipe.recipeCookTime),
		ingredients: recipe.recipeIngredients,
		instructions: recipe.recipeInstructions,
		imageUrl,
	};
};

export const serializeProfilePayload = (target, profile) =>
	isNestTarget(target) ? profile : { formData: profile };

export const getUpdatedProfileUser = (target, responseData) =>
	isNestTarget(target) ? responseData : responseData?.user;

export const isWishlistAddSuccess = (target, status) =>
	status === (isNestTarget(target) ? 201 : 200);

export const isRecipeCreateSuccess = (target, status) =>
	status === (isNestTarget(target) ? 201 : 200);

export const isRecipeDeleteSuccess = (target, status) =>
	status === (isNestTarget(target) ? 204 : 200);
