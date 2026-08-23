import { apiTargets } from "@/shared/api/routes";

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
 * Keep collection capability explicit until both API contracts can persist it.
 * The target argument makes the decision testable for every supported backend.
 */
export const getSavedCollectionsContract = (target) => {
	if (target !== apiTargets.LEGACY && target !== apiTargets.NEST) {
		throw new Error(`Unknown API target: ${target}`);
	}

	return unsupportedContract;
};
