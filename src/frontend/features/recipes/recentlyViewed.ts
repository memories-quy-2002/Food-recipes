export type RecentlyViewedRecipe = {
	recipeId: number;
	viewedAt: string;
};

export const RECENTLY_VIEWED_STORAGE_KEY = "food-recipes:recently-viewed";
export const RECENTLY_VIEWED_LIMIT = 20;

const readRecentlyViewed = (storage: Storage): RecentlyViewedRecipe[] => {
	try {
		const raw = storage.getItem(RECENTLY_VIEWED_STORAGE_KEY);
		if (!raw) return [];
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter(
			(item): item is RecentlyViewedRecipe =>
				typeof item?.recipeId === "number" &&
				Number.isSafeInteger(item.recipeId) &&
				item.recipeId > 0 &&
				typeof item.viewedAt === "string" &&
				Number.isFinite(Date.parse(item.viewedAt)),
		);
	} catch {
		return [];
	}
};

export const getRecentlyViewedRecipes = (storage: Storage = window.localStorage) =>
	readRecentlyViewed(storage);

export const getRecentlyViewedRecipeIds = (storage: Storage = window.localStorage) =>
	readRecentlyViewed(storage).map((item) => item.recipeId);

export const recordRecentlyViewedRecipe = (
	storage: Storage = window.localStorage,
	recipeId: number,
	viewedAt: Date = new Date(),
) => {
	if (!Number.isSafeInteger(Number(recipeId)) || Number(recipeId) <= 0) return;
	const nextItem = { recipeId: Number(recipeId), viewedAt: viewedAt.toISOString() };
	const next = [
		nextItem,
		...readRecentlyViewed(storage).filter((item) => item.recipeId !== nextItem.recipeId),
	].slice(0, RECENTLY_VIEWED_LIMIT);
	storage.setItem(RECENTLY_VIEWED_STORAGE_KEY, JSON.stringify(next));
};

export const clearRecentlyViewedRecipes = (storage: Storage = window.localStorage) =>
	storage.removeItem(RECENTLY_VIEWED_STORAGE_KEY);
