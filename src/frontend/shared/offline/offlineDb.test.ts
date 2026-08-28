import { describe, expect, it } from "vitest";
import { cacheKeys, isOfflineCacheKey } from "./cacheKeys";
import { OfflineDb } from "./offlineDb";

describe("offline cache", () => {
	it("uses account and household scope in private cache keys", () => {
		expect(cacheKeys.shoppingList(7, { kind: "personal" })).toBe("shopping-list:7:personal");
		expect(cacheKeys.shoppingList(7, { kind: "household", householdId: 9 })).toBe("shopping-list:7:household-9");
	});

	it("persists a safe snapshot across database instances without storing tokens", async () => {
		const first = new OfflineDb("test-offline");
		await first.set("shopping-list:7:personal", { items: [{ item_id: 1 }] });
		const second = new OfflineDb("test-offline");
		expect(await second.get("shopping-list:7:personal")).toEqual({ items: [{ item_id: 1 }] });
		expect(isOfflineCacheKey("auth-refresh-token")).toBe(false);
		await expect(first.set("auth-refresh-token", "secret")).rejects.toThrow("Sensitive values");
	});
});
