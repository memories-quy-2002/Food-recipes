import { describe, expect, it } from "vitest";
import { isRecipeFavorite } from "./FoodCardList";

describe("FoodCardList favorite identity", () => {
	it("supports nested and legacy wishlist payloads", () => {
		expect(
			isRecipeFavorite({ recipe_id: 7 }, [
				{ recipe: { recipe_id: 7 }, savedAt: "2026-08-23T10:00:00.000Z" },
			])
		).toBe(true);
		expect(isRecipeFavorite({ recipe_id: 7 }, [{ recipe_id: 7 }])).toBe(true);
	});
});
