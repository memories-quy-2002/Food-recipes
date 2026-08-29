import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "@/shared/api/axios";
import {
	createPantryItem,
	deletePantryItem,
	importCheckedShoppingItems,
	listPantry,
	updatePantryItem,
} from "./pantryApi";
import { householdScope, PERSONAL_KITCHEN } from "@/features/households/householdScope";
import { createPantryRoutes } from "@/shared/api/routes";

vi.mock("@/shared/api/axios", () => ({
	default: {
		get: vi.fn(),
		post: vi.fn(),
		patch: vi.fn(),
		delete: vi.fn(),
	},
}));

const mockedAxios = vi.mocked(axios);

describe("pantry API scope routing", () => {
	beforeEach(() => vi.clearAllMocks());

	it("keeps personal pantry routes unchanged", () => {
		const routes = createPantryRoutes(PERSONAL_KITCHEN);

		expect(routes.pantry).toBe("/users/me/pantry");
		expect(routes.pantryItem(4)).toBe("/users/me/pantry/4");
		expect(routes.pantryFromShoppingList).toBe("/users/me/pantry/from-shopping-list");
	});

	it("creates household pantry collection and item routes", () => {
		const routes = createPantryRoutes(householdScope(12));

		expect(routes.pantry).toBe("/households/12/pantry");
		expect(routes.pantryItem(4)).toBe("/households/12/pantry/4");
		expect(routes.pantryFromShoppingList).toBe("/households/12/pantry/from-shopping-list");
	});

	it("uses the household scope for pantry reads and mutations", async () => {
		const scope = householdScope(12);
		mockedAxios.get.mockResolvedValueOnce({ data: { items: [] } });
		mockedAxios.post.mockResolvedValueOnce({ data: { item: { pantry_id: 4 } } });
		mockedAxios.patch.mockResolvedValueOnce({ data: { item: { pantry_id: 4 } } });
		mockedAxios.delete.mockResolvedValueOnce({ data: { message: "removed" } });
		mockedAxios.post.mockResolvedValueOnce({ data: { imported_items: 1, skipped_items: [] } });

		await listPantry(scope);
		await createPantryItem({ name: "Rice" }, scope);
		await updatePantryItem(4, { have: false }, scope);
		await deletePantryItem(4, scope);
		await importCheckedShoppingItems(scope);

		expect(mockedAxios.get).toHaveBeenCalledWith("/households/12/pantry", { signal: undefined });
		expect(mockedAxios.post).toHaveBeenCalledWith("/households/12/pantry", { name: "Rice" });
		expect(mockedAxios.patch).toHaveBeenCalledWith("/households/12/pantry/4", { have: false });
		expect(mockedAxios.delete).toHaveBeenCalledWith("/households/12/pantry/4");
		expect(mockedAxios.post).toHaveBeenCalledWith("/households/12/pantry/from-shopping-list");
	});
});
