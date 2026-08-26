type PayloadRecord = Record<string, unknown>;

export type PayloadItemGuard<T> = (value: unknown) => value is T;

const isPayloadRecord = (value: unknown): value is PayloadRecord =>
	typeof value === "object" && value !== null;

export function getArrayPayload(payload: unknown, key?: string): unknown[];
export function getArrayPayload<T>(
	payload: unknown,
	key: string | undefined,
	guard: PayloadItemGuard<T>,
): T[];
export function getArrayPayload<T>(
	payload: unknown,
	key?: string,
	guard?: PayloadItemGuard<T>,
): unknown[] {
	const value = key && isPayloadRecord(payload) ? payload[key] : payload;
	const items: unknown[] = Array.isArray(value)
		? value
		: Array.isArray(payload)
			? payload
			: [];

	return guard ? items.filter(guard) : items;
}
