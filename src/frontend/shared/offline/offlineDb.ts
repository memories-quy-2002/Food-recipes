import { isOfflineCacheKey } from "./cacheKeys";

type StoredValue = { key: string; value: unknown; updatedAt: string };
const memoryStore = new Map<string, StoredValue>();

export class OfflineDb {
	private readonly databaseName: string;
	private databasePromise: Promise<IDBDatabase> | null = null;

	constructor(databaseName = "food-recipes-offline") {
		this.databaseName = databaseName;
	}

	private open(): Promise<IDBDatabase> {
		if (typeof indexedDB === "undefined") return Promise.reject(new Error("IndexedDB is unavailable"));
		this.databasePromise ??= new Promise((resolve, reject) => {
			const request = indexedDB.open(this.databaseName, 1);
			request.onupgradeneeded = () => request.result.createObjectStore("snapshots", { keyPath: "key" });
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error ?? new Error("IndexedDB could not open"));
		});
		return this.databasePromise;
	}

	async get<T>(key: string): Promise<T | undefined> {
		if (!isOfflineCacheKey(key)) return undefined;
		try {
			const database = await this.open();
			return await new Promise<T | undefined>((resolve, reject) => {
				const request = database.transaction("snapshots", "readonly").objectStore("snapshots").get(key);
				request.onsuccess = () => resolve((request.result as StoredValue | undefined)?.value as T | undefined);
				request.onerror = () => reject(request.error);
			});
		} catch {
			return memoryStore.get(key)?.value as T | undefined;
		}
	}

	async set<T>(key: string, value: T): Promise<void> {
		if (!isOfflineCacheKey(key)) throw new Error("Sensitive values cannot be stored in the offline cache");
		const stored: StoredValue = { key, value, updatedAt: new Date().toISOString() };
		memoryStore.set(key, stored);
		try {
			const database = await this.open();
			await new Promise<void>((resolve, reject) => {
				const request = database.transaction("snapshots", "readwrite").objectStore("snapshots").put(stored);
				request.onsuccess = () => resolve();
				request.onerror = () => reject(request.error);
			});
		} catch {
			// The in-memory fallback keeps unit tests and browsers without IndexedDB usable.
		}
	}

	async remove(key: string): Promise<void> {
		memoryStore.delete(key);
		try {
			const database = await this.open();
			await new Promise<void>((resolve, reject) => {
				const request = database.transaction("snapshots", "readwrite").objectStore("snapshots").delete(key);
				request.onsuccess = () => resolve();
				request.onerror = () => reject(request.error);
			});
		} catch {
			// Nothing else to remove when IndexedDB is unavailable.
		}
	}
}

export const offlineDb = new OfflineDb();
