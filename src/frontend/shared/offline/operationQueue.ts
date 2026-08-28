import { offlineDb } from "./offlineDb";

export type OfflineOperation =
	| { id: string; kind: "shopping-check"; itemId: number; checked: boolean; createdAt: string }
	| { id: string; kind: "cooking-progress"; sessionId: number; currentStep: number; createdAt: string };

export type SyncResult = "applied" | "deleted" | "retry";
export type SyncOperation = (operation: OfflineOperation) => Promise<SyncResult>;
export type OperationQueueStore = { get<T>(key: string): Promise<T | undefined>; set<T>(key: string, value: T): Promise<void>; remove(key: string): Promise<void> };

export class DeletedOfflineResourceError extends Error {
	readonly code = "OFFLINE_RESOURCE_DELETED";
}

const QUEUE_KEY = "offline-operation-queue";
const isOperation = (value: unknown): value is OfflineOperation => {
	if (typeof value !== "object" || value === null) return false;
	const operation = value as Partial<OfflineOperation>;
	return typeof operation.id === "string" && typeof operation.createdAt === "string" &&
		(operation.kind === "shopping-check" && typeof operation.itemId === "number" && typeof operation.checked === "boolean" ||
		operation.kind === "cooking-progress" && typeof operation.sessionId === "number" && typeof operation.currentStep === "number");
};

const isRetryableError = (error: unknown): boolean => {
	if (error instanceof DeletedOfflineResourceError) return false;
	if (typeof error === "object" && error !== null && "status" in error) {
		const status = Number((error as { status?: number }).status);
		if (status === 404 || status === 410) return false;
	}
	return true;
};

export const resolveShoppingCheck = (_serverChecked: boolean, localChecked: boolean): boolean => localChecked;
export const resolveCookingProgress = (serverStep: number, localStep: number): number => Math.max(serverStep, localStep);

export class OfflineOperationQueue {
	private readonly store: OperationQueueStore;

	constructor(store: OperationQueueStore = offlineDb) {
		this.store = store;
	}

	async list(): Promise<OfflineOperation[]> {
		const stored = await this.store.get<unknown>(QUEUE_KEY);
		return Array.isArray(stored) ? stored.filter(isOperation) : [];
	}

	async enqueue(operation: OfflineOperation): Promise<void> {
		if (!isOperation(operation)) throw new Error("Invalid offline operation");
		const operations = await this.list();
		operations.push(operation);
		await this.store.set(QUEUE_KEY, operations);
	}

	async flush(sync: SyncOperation, onNotice: (message: string) => void = () => undefined): Promise<{ applied: number; discarded: number; remaining: number }> {
		let applied = 0;
		let discarded = 0;
		const operations = await this.list();
		for (const operation of operations) {
			try {
				const result = await sync(operation);
				if (result === "retry") break;
				await this.remove(operation.id);
				if (result === "deleted") {
					discarded += 1;
					onNotice("A queued change was discarded because the item no longer exists.");
				} else applied += 1;
			} catch (error) {
				if (!isRetryableError(error)) {
					await this.remove(operation.id);
					discarded += 1;
					onNotice("A queued change was discarded because the item no longer exists.");
					continue;
				}
				break;
			}
		}
		return { applied, discarded, remaining: (await this.list()).length };
	}

	private async remove(id: string): Promise<void> {
		const remaining = (await this.list()).filter((operation) => operation.id !== id);
		if (remaining.length) await this.store.set(QUEUE_KEY, remaining);
		else await this.store.remove(QUEUE_KEY);
	}
}

export const offlineOperationQueue = new OfflineOperationQueue();
