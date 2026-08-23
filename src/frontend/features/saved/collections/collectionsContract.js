const unsupportedContract = Object.freeze({
	status: "unsupported",
	defaultCollection: Object.freeze({ id: "all-saved", name: "All saved" }),
	canCreate: false,
	canRename: false,
	canDelete: false,
	canAssignRecipes: false,
	mutations: null,
	reason:
		"The active API exposes saved-recipe membership only; it does not expose collection persistence or ownership-safe collection endpoints.",
});

/**
 * Keep collection capability explicit until the API can persist it.
 */
export const getSavedCollectionsContract = () => unsupportedContract;
