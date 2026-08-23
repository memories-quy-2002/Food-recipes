import { describe, expect, it } from "vitest";
import { getSavedCollectionsContract } from "./collectionsContract";

describe("Saved collections API contract", () => {
	it("keeps collection CRUD blocked when the backend has no contract", () => {
		const contract = getSavedCollectionsContract();

		expect(contract.status).toBe("unsupported");
		expect(contract.defaultCollection).toEqual({
			id: "all-saved",
			name: "All saved",
		});
		expect(contract.canCreate).toBe(false);
		expect(contract.canRename).toBe(false);
		expect(contract.canDelete).toBe(false);
		expect(contract.canAssignRecipes).toBe(false);
	});

	it("does not expose a client mutation path that could pretend to persist collections", () => {
		const contract = getSavedCollectionsContract();

		expect(contract.mutations).toBeNull();
		expect(contract.reason).toContain("collection persistence");
	});
});
