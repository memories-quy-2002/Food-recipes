import { describe, expect, it } from "vitest";
import { OfflineOperationQueue, resolveCookingProgress, resolveShoppingCheck, type OfflineOperation, type OperationQueueStore } from "./operationQueue";

const createStore = (): OperationQueueStore => {
	const values = new Map<string, unknown>();
	return { get: async <T>(key: string) => values.get(key) as T | undefined, set: async (key, value) => { values.set(key, value); }, remove: async (key) => { values.delete(key); } };
};

const shoppingOperation: OfflineOperation = { id: "op-1", kind: "shopping-check", itemId: 4, checked: true, createdAt: "2026-08-28T10:00:00Z" };

describe("OfflineOperationQueue", () => {
	it("survives a reload and applies the documented conflict rules", async () => {
		const store = createStore();
		await new OfflineOperationQueue(store).enqueue(shoppingOperation);
		expect(await new OfflineOperationQueue(store).list()).toEqual([shoppingOperation]);
		expect(resolveShoppingCheck(false, true)).toBe(true);
		expect(resolveCookingProgress(4, 7)).toBe(7);
	});

	it("removes successfully synced operations", async () => {
		const store = createStore();
		const queue = new OfflineOperationQueue(store);
		await queue.enqueue(shoppingOperation);
		await expect(queue.flush(async () => "applied")).resolves.toMatchObject({ applied: 1, remaining: 0 });
	});

	it("leaves retryable failures queued and discards deleted resources with a notice", async () => {
		const store = createStore();
		const queue = new OfflineOperationQueue(store);
		await queue.enqueue(shoppingOperation);
		await expect(queue.flush(async () => "retry")).resolves.toMatchObject({ remaining: 1 });
		const notices: string[] = [];
		await expect(queue.flush(async () => "deleted", (message) => notices.push(message))).resolves.toMatchObject({ discarded: 1, remaining: 0 });
		expect(notices).toHaveLength(1);
	});
});
