import type { RecipeDetail, RecipeNutrition, StructuredIngredient } from '@/shared/api/contracts';
import { formatStructuredIngredient } from '@/features/recipes/structuredIngredients';

export type RecipeStructuredDataRecipe = {
	recipe_id?: number | string | null;
	recipe_name?: string | null;
	recipe_description?: string | null;
	image_url?: string | null;
	date_added?: string | Date | null;
	publishedAt?: string | Date | null;
	published_at?: string | Date | null;
	updatedAt?: string | Date | null;
	updated_at?: string | Date | null;
	prep_time_minutes?: number | string | null;
	cook_time_minutes?: number | string | null;
	total_time_minutes?: number | string | null;
	category_name?: string | null;
	full_name?: string | null;
	overall_score?: number | string | null;
	num_ratings?: number | string | null;
	ingredients?: unknown[] | null;
	instructions?: unknown[] | null;
	structured_ingredients?: Array<StructuredIngredient & { note?: string | null }> | null;
	structuredIngredients?: Array<StructuredIngredient & { note?: string | null }> | null;
	nutrition?: RecipeNutrition | null;
	metadata?: RecipeDetail['metadata'] | null;
	dietaryTags?: string[] | null;
	dietary_tags?: string[] | null;
};

const DIET_URLS: Record<string, string> = {
	glutenfree: 'https://schema.org/GlutenFreeDiet',
	halal: 'https://schema.org/HalalDiet',
	lowcalorie: 'https://schema.org/LowCalorieDiet',
	lowfat: 'https://schema.org/LowFatDiet',
	lowsodium: 'https://schema.org/LowSodiumDiet',
	vegan: 'https://schema.org/VeganDiet',
	vegetarian: 'https://schema.org/VegetarianDiet',
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null;

const toNumber = (value: unknown): number | null => {
	if (typeof value === 'number') return Number.isFinite(value) ? value : null;
	if (typeof value !== 'string' || !value.trim()) return null;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
};

const toText = (value: unknown): string | undefined => {
	if (typeof value !== 'string' && typeof value !== 'number') return undefined;
	const text = String(value).trim();
	return text || undefined;
};

const toTextArray = (value: unknown): string[] =>
	Array.isArray(value)
		? value.map(toText).filter((item): item is string => Boolean(item))
		: [];

const formatNumber = (value: number): string =>
	Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));

const toIsoDate = (value: unknown): string | undefined => {
	if (!(typeof value === 'string' || value instanceof Date)) return undefined;
	const timestamp = new Date(value).getTime();
	return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : undefined;
};

const toIsoDuration = (value: unknown): string | undefined => {
	const minutes = toNumber(value);
	if (minutes === null || minutes < 0) return undefined;

	let seconds = Math.round(minutes * 60);
	if (seconds === 0) return 'PT0M';
	const hours = Math.floor(seconds / 3600);
	seconds %= 3600;
	const remainingMinutes = Math.floor(seconds / 60);
	seconds %= 60;
	return 'PT'
		+ (hours > 0 ? hours + 'H' : '')
		+ (remainingMinutes > 0 ? remainingMinutes + 'M' : '')
		+ (seconds > 0 ? seconds + 'S' : '');
};

const toAbsoluteUrl = (value: unknown, canonicalUrl: string): string | undefined => {
	const image = toText(value);
	if (!image) return undefined;
	try {
		return new URL(image, canonicalUrl).toString();
	} catch {
		return undefined;
	}
};

const getIngredientTexts = (recipe: RecipeStructuredDataRecipe): string[] => {
	const structured = Array.isArray(recipe.structured_ingredients)
		? recipe.structured_ingredients
		: Array.isArray(recipe.structuredIngredients)
			? recipe.structuredIngredients
			: [];
	const structuredTexts = structured
		.filter((ingredient) => isRecord(ingredient) && typeof ingredient.name === 'string')
		.map((ingredient) => formatStructuredIngredient(ingredient))
		.filter((ingredient) => ingredient.trim().length > 0);
	return structuredTexts.length > 0 ? structuredTexts : toTextArray(recipe.ingredients);
};

const getInstructionTexts = (instructions: unknown): string[] => toTextArray(instructions);

const getRecipeYield = (nutrition: RecipeNutrition | null | undefined): string | undefined => {
	const servings = toNumber(nutrition?.servings);
	return servings !== null && servings > 0 ? formatNumber(servings) + ' serving' + (servings === 1 ? '' : 's') : undefined;
};

const getNutritionData = (recipe: RecipeStructuredDataRecipe): Record<string, unknown> | undefined => {
	const metadataNutrition = recipe.metadata?.nutrition;
	const nutrition = recipe.nutrition;
	const values: Array<[string, unknown, string]> = [
		['calories', metadataNutrition?.calories_per_serving ?? nutrition?.calories, ' calories'],
		['proteinContent', metadataNutrition?.protein_grams ?? nutrition?.protein, ' g'],
		['carbohydrateContent', metadataNutrition?.carbohydrates_grams ?? nutrition?.carbohydrates, ' g'],
		['fatContent', metadataNutrition?.fat_grams ?? nutrition?.fat, ' g'],
		['fiberContent', metadataNutrition?.fiber_grams ?? nutrition?.fiber, ' g'],
		['sugarContent', metadataNutrition?.sugar_grams ?? nutrition?.sugar, ' g'],
		['sodiumContent', metadataNutrition?.sodium_milligrams ?? nutrition?.sodium, ' mg'],
	];
	const data: Record<string, unknown> = { '@type': 'NutritionInformation' };
	values.forEach(([key, value, suffix]) => {
		const numericValue = toNumber(value);
		if (numericValue !== null && numericValue >= 0) data[key] = formatNumber(numericValue) + suffix;
	});
	return Object.keys(data).length > 1 ? data : undefined;
};

const getDietUrls = (tags: string[] | null | undefined): string[] =>
	(tags ?? [])
		.map((tag) => DIET_URLS[tag.trim().toLowerCase().replace(/[\s_-]+/g, '')])
		.filter((url): url is string => Boolean(url));

export const createRecipeStructuredData = (
	recipe: RecipeStructuredDataRecipe,
	canonicalUrl: string,
): Record<string, unknown> | null => {
	const name = toText(recipe.recipe_name);
	if (!name) return null;

	const description = toText(recipe.recipe_description);
	const data: Record<string, unknown> = {
		'@context': 'https://schema.org',
		'@type': 'Recipe',
		name,
		url: canonicalUrl,
		isAccessibleForFree: true,
	};
	const image = toAbsoluteUrl(recipe.image_url, canonicalUrl);
	if (image) data.image = image;
	if (description) data.description = description;
	if (toText(recipe.full_name)) data.author = { '@type': 'Person', name: toText(recipe.full_name) };
	if (toText(recipe.category_name)) data.recipeCategory = toText(recipe.category_name);

	const publishedAt = toIsoDate(recipe.publishedAt ?? recipe.published_at ?? recipe.date_added);
	const updatedAt = toIsoDate(recipe.updatedAt ?? recipe.updated_at);
	if (publishedAt) data.datePublished = publishedAt;
	if (updatedAt) data.dateModified = updatedAt;

	const prepTime = toIsoDuration(recipe.prep_time_minutes);
	const cookTime = toIsoDuration(recipe.cook_time_minutes);
	const totalTime = toIsoDuration(recipe.total_time_minutes)
		?? (prepTime && cookTime ? toIsoDuration((toNumber(recipe.prep_time_minutes) ?? 0) + (toNumber(recipe.cook_time_minutes) ?? 0)) : undefined);
	if (prepTime) data.prepTime = prepTime;
	if (cookTime) data.cookTime = cookTime;
	if (totalTime) data.totalTime = totalTime;

	const recipeYield = getRecipeYield(recipe.nutrition);
	if (recipeYield) data.recipeYield = recipeYield;

	const ingredients = getIngredientTexts(recipe);
	if (ingredients.length > 0) data.recipeIngredient = ingredients;
	const instructions = getInstructionTexts(recipe.instructions).map((text, index) => ({
		'@type': 'HowToStep',
		position: index + 1,
		text,
	}));
	if (instructions.length > 0) data.recipeInstructions = instructions;

	const nutritionData = getNutritionData(recipe);
	if (nutritionData) data.nutrition = nutritionData;

	const ratingCount = toNumber(recipe.num_ratings);
	const ratingValue = toNumber(recipe.overall_score);
	if (ratingCount !== null && ratingCount > 0 && ratingValue !== null && ratingValue >= 1 && ratingValue <= 5) {
		data.aggregateRating = {
			'@type': 'AggregateRating',
			ratingValue: formatNumber(ratingValue),
			ratingCount: Math.trunc(ratingCount),
			bestRating: '5',
			worstRating: '1',
		};
	}

	const dietUrls = getDietUrls(recipe.dietaryTags ?? recipe.dietary_tags);
	if (dietUrls.length > 0) data.suitableForDiet = dietUrls;
	const keywords = toTextArray(recipe.dietaryTags ?? recipe.dietary_tags);
	if (keywords.length > 0) data.keywords = keywords.join(', ');

	return data;
};
