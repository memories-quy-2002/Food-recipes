export const getArrayPayload = (payload, key) => {
	const value = key ? payload?.[key] : payload;

	if (Array.isArray(value)) return value;
	if (Array.isArray(payload)) return payload;

	return [];
};
