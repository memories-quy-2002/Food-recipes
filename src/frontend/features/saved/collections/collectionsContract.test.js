import { describe, expect, it } from "vitest";
import { apiTargets } from "@/shared/api/routes";
import { getSavedCollectionsContract } from "./collectionsContract";

describe("Saved collections API contract", () => {
	it.each([apiTargets.LEGACY, apiTargets.NEST])(
		"keeps collection CRUD blocked for the %s target when the backend has no collection contract",
		(target) => {
			const contract = getSavedCollectionsContract(target);

			expect(contract.status).toBe("unsupported");
			expect(contract.defaultCollection).toEqual({
				id: "all-saved",
				name: "All saved",
			});
			expect(contract.canCreate).toBe(false);
			expect(contract.canRename).toBe(false);
			expect(contract.canDelete).toBe(false);
			expect(contract.canAssignRecipes).toBe(false);
		},
	);

	it("does not expose a client mutation path that could pretend to persist collections", () => {
		const contract = getSavedCollectionsContract(apiTargets.NEST);

		expect(contract.mutations).toBeNull();
		expect(contract.reason).toContain("collection persistence");
	});
});
