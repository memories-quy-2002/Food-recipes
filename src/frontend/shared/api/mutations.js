const findCatalogId = (items, name, label) => {
	const normalizedName = String(name || "").trim().toLowerCase();
	const match = items.find((item) => {
		const itemName = item.name ?? item.category_name ?? item.meal_name;
		return String(itemName || "").trim().toLowerCase() === normalizedName;
	});
	const id = Number(match?.id ?? match?.category_id ?? match?.meal_id);

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

export const serializeWishlistPayload = (recipeId) => ({ recipeId });

export const serializeCreateRecipePayload = ({
	recipe,
	categories,
	meals,
	imageUrl,
}) => ({
	name: recipe.recipeName.trim(),
	description: recipe.recipeDescription,
	mealId: findCatalogId(meals, recipe.recipeMealName, "meal"),
	categoryId: findCatalogId(categories, recipe.recipeCategoryName, "category"),
	prepTimeMinutes: toMinutes(recipe.recipePrepTime),
	cookTimeMinutes: toMinutes(recipe.recipeCookTime),
	ingredients: recipe.recipeIngredients,
	instructions: recipe.recipeInstructions,
	imageUrl,
});

export const serializeProfilePayload = (profile) => profile;

export const getUpdatedProfileUser = (responseData) => responseData;

export const isWishlistAddSuccess = (status) => status === 201;

export const isRecipeCreateSuccess = (status) => status === 201;

export const isRecipeDeleteSuccess = (status) => status === 204;
