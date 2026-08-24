import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";
import {
	addRecipeToCollection,
	createCollection,
	deleteCollection,
	listCollectionRecipes,
	listCollections,
	removeRecipeFromCollection,
	renameCollection,
} from "./collectionsApi";

vi.mock("@/shared/api/axios", () => ({
	default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

describe("collections API", () => {
	beforeEach(() => vi.clearAllMocks());

	it("keeps collection reads and mutations on the authenticated routes", async () => {
		vi.mocked(axios.get)
			.mockResolvedValueOnce({ data: { collections: [] } })
			.mockResolvedValueOnce({ data: { recipes: [] } });
		vi.mocked(axios.post)
			.mockResolvedValueOnce({ data: { collection: { collection_id: 3 } } })
			.mockResolvedValueOnce({ data: { collection: { collection_id: 3 } } });
		vi.mocked(axios.patch).mockResolvedValueOnce({ data: { collection: { collection_id: 3 } } });
		vi.mocked(axios.delete).mockResolvedValue({ data: { message: "ok" } });

		await listCollections();
		await listCollectionRecipes(3);
		await createCollection(" Weeknight dinners ");
		await renameCollection(3, "Quick dinners");
		await addRecipeToCollection(3, 7);
		await removeRecipeFromCollection(3, 7);
		await deleteCollection(3);

		expect(axios.get).toHaveBeenNthCalledWith(1, apiRoutes.userCollections, { signal: undefined });
		expect(axios.get).toHaveBeenNthCalledWith(2, apiRoutes.userCollectionRecipes(3), { signal: undefined });
		expect(axios.post).toHaveBeenNthCalledWith(1, apiRoutes.userCollections, { name: " Weeknight dinners " });
		expect(axios.patch).toHaveBeenCalledWith(apiRoutes.userCollection(3), { name: "Quick dinners" });
		expect(axios.post).toHaveBeenNthCalledWith(2, apiRoutes.userCollectionRecipes(3), { recipeId: 7 });
		expect(axios.delete).toHaveBeenNthCalledWith(1, apiRoutes.userCollectionRecipe(3, 7));
		expect(axios.delete).toHaveBeenNthCalledWith(2, apiRoutes.userCollection(3));
	});
});
