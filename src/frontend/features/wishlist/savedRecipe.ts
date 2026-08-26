export const getSavedAtTimestamp = (savedAt: string | null | undefined): number => {
	if (!savedAt) return Number.NEGATIVE_INFINITY;
	const timestamp = new Date(savedAt).getTime();
	return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
};

export const formatSavedAt = (savedAt: string | null | undefined): string => {
	const timestamp = getSavedAtTimestamp(savedAt);
	if (!Number.isFinite(timestamp)) return "Saved date unavailable";
	return `Saved ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(timestamp))}`;
};
