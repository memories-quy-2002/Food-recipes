import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "@/shared/api/axios";
import {
	createPantryItem,
	deletePantryItem,
	importCheckedShoppingItems,
	listPantry,
	updatePantryItem,
} from "./pantryApi";
import { PERSONAL_KITCHEN } from "@/shared/api/personalKitchenScope";
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


});
