import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "@/shared/api/axios";
import {
	addMealPlanItem,
	createMealPlan,
	deleteMealPlanItem,
	getMealPlan,
	listMealPlans,
	updateMealPlanItem,
} from "./planningApi";
import { householdScope } from "@/features/households/householdScope";

vi.mock("@/shared/api/axios", () => ({
	default: {
		get: vi.fn(),
		post: vi.fn(),
		patch: vi.fn(),
		delete: vi.fn(),
	},
}));

const mockedAxios = vi.mocked(axios);

describe("planning API", () => {
	beforeEach(() => vi.clearAllMocks());

	it("lists plans for the visible date range", async () => {
		mockedAxios.get.mockResolvedValueOnce({ data: { plans: [] } });

		await listMealPlans({ from: "2026-08-24", to: "2026-08-30" });

		expect(mockedAxios.get).toHaveBeenCalledWith("/users/me/meal-plans", {
			params: { from: "2026-08-24", to: "2026-08-30" },
		});
	});

	it("creates a named plan with the backend date fields", async () => {
		mockedAxios.post.mockResolvedValueOnce({ data: { plan: { plan_id: 12 } } });

		await createMealPlan({
			name: "This week",
			from: "2026-08-24",
			to: "2026-08-30",
		});

		expect(mockedAxios.post).toHaveBeenCalledWith("/users/me/meal-plans", {
			name: "This week",
			from: "2026-08-24",
			to: "2026-08-30",
		});
	});

	it("posts an item using the meal-plan contract", async () => {
		mockedAxios.post.mockResolvedValueOnce({ data: { item: { item_id: 4 } } });

		await addMealPlanItem(12, {
			recipeId: 7,
			date: "2026-08-24",
			slot: "dinner",
			servings: 4,
		});

		expect(mockedAxios.post).toHaveBeenCalledWith("/users/me/meal-plans/12/items", {
			recipeId: 7,
			date: "2026-08-24",
			slot: "dinner",
			servings: 4,
		});
	});

	it("patches and deletes a planned item through owner-scoped routes", async () => {
		mockedAxios.patch.mockResolvedValueOnce({ data: { item: { item_id: 4 } } });
		mockedAxios.delete.mockResolvedValueOnce({ data: { message: "removed" } });

		await updateMealPlanItem(12, 4, { servings: 6, slot: "lunch" });
		await deleteMealPlanItem(12, 4);

		expect(mockedAxios.patch).toHaveBeenCalledWith("/users/me/meal-plans/12/items/4", {
			servings: 6,
			slot: "lunch",
		});
		expect(mockedAxios.delete).toHaveBeenCalledWith("/users/me/meal-plans/12/items/4");
	});

	it("uses household meal-plan collection and item routes", async () => {
		const scope = householdScope(12);
		mockedAxios.get
			.mockResolvedValueOnce({ data: { plans: [] } })
			.mockResolvedValueOnce({ data: { plan: { plan_id: 12 }, items: [] } });
		mockedAxios.post
			.mockResolvedValueOnce({ data: { plan: { plan_id: 12 } } })
			.mockResolvedValueOnce({ data: { item: { item_id: 4 } } });
		mockedAxios.patch.mockResolvedValueOnce({ data: { item: { item_id: 4 } } });
		mockedAxios.delete.mockResolvedValueOnce({ data: { message: "removed" } });

		await listMealPlans({ from: "2026-08-24", to: "2026-08-30" }, undefined, scope);
		await getMealPlan(12, undefined, scope);
		await createMealPlan(
			{ name: "Shared week", from: "2026-08-24", to: "2026-08-30" },
			scope,
		);
		await addMealPlanItem(
			12,
			{ recipeId: 7, date: "2026-08-24", slot: "dinner", servings: 4 },
			scope,
		);
		await updateMealPlanItem(12, 4, { servings: 6 }, scope);
		await deleteMealPlanItem(12, 4, scope);

		expect(mockedAxios.get).toHaveBeenNthCalledWith(1, "/households/12/meal-plans", {
			params: { from: "2026-08-24", to: "2026-08-30" },
			signal: undefined,
		});
		expect(mockedAxios.get).toHaveBeenNthCalledWith(2, "/households/12/meal-plans/12", {
			signal: undefined,
		});
		expect(mockedAxios.post).toHaveBeenNthCalledWith(1, "/households/12/meal-plans", {
			name: "Shared week",
			from: "2026-08-24",
			to: "2026-08-30",
		});
		expect(mockedAxios.post).toHaveBeenNthCalledWith(
			2,
			"/households/12/meal-plans/12/items",
			{ recipeId: 7, date: "2026-08-24", slot: "dinner", servings: 4 },
		);
		expect(mockedAxios.patch).toHaveBeenCalledWith(
			"/households/12/meal-plans/12/items/4",
			{ servings: 6 },
		);
		expect(mockedAxios.delete).toHaveBeenCalledWith(
			"/households/12/meal-plans/12/items/4",
		);
	});
});
