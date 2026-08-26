export const RECIPE_FILTER_OPTIONS = [
	{ value: "quick", label: "Quick" },
	{ value: "vegetarian", label: "Vegetarian" },
	{ value: "high-protein", label: "High Protein" },
	{ value: "under-30", label: "Under 30 Minutes" },
	{ value: "one-pan", label: "One Pan" },
	{ value: "beginner", label: "Beginner" },
] as const;

export type RecipeFilterOption = (typeof RECIPE_FILTER_OPTIONS)[number];

export const RECIPE_SORT_OPTIONS = [
	{ value: "popular", label: "Recommended" },
	{ value: "rating", label: "Top Rated" },
	{ value: "newest", label: "Newest" },
	{ value: "quickest", label: "Quickest" },
] as const;

export type RecipeSortOption = (typeof RECIPE_SORT_OPTIONS)[number];
