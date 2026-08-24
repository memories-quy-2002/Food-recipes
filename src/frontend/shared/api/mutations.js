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

const findOptionalCatalogId = (items, name) => {
	const normalizedName = String(name || "").trim().toLowerCase();
	const match = items.find((item) => {
		const itemName = item.name ?? item.category_name ?? item.meal_name;
		return String(itemName || "").trim().toLowerCase() === normalizedName;
	});
	const id = Number(match?.id ?? match?.category_id ?? match?.meal_id);
	return Number.isInteger(id) && id > 0 ? id : undefined;
};

const toOptionalMinutes = (time) => {
	try {
		return toMinutes(time);
	} catch {
		return undefined;
	}
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

export const serializeCreateRecipeDraftPayload = ({
	recipe,
	categories,
	meals,
	imageUrl,
}) => {
	const payload = {
		name: recipe.recipeName?.trim() || undefined,
		description: recipe.recipeDescription?.trim() || undefined,
		mealId: findOptionalCatalogId(meals, recipe.recipeMealName),
		categoryId: findOptionalCatalogId(categories, recipe.recipeCategoryName),
		prepTimeMinutes: toOptionalMinutes(recipe.recipePrepTime),
		cookTimeMinutes: toOptionalMinutes(recipe.recipeCookTime),
		ingredients: (recipe.recipeIngredients || []).map((value) => value.trim()).filter(Boolean),
		instructions: (recipe.recipeInstructions || []).map((value) => value.trim()).filter(Boolean),
	};
	if (imageUrl) payload.imageUrl = imageUrl;
	return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
};

export const serializeProfilePayload = (profile) => profile;

export const getUpdatedProfileUser = (responseData) => responseData;

export const isWishlistAddSuccess = (status) => status === 201;

export const isRecipeCreateSuccess = (status) => status === 201;

export const isRecipeDeleteSuccess = (status) => status === 204;
