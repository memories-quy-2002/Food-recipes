const normalize = (value: string) => value.trim().toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

export const isShoppingItemInPantry = (label: string, pantryNames: string[]) => {
	const normalizedLabel = normalize(label);
	if (!normalizedLabel) return false;
	return pantryNames.some((name) => {
		const normalizedName = normalize(name);
		if (!normalizedName || normalizedName.length < 3) return false;
		return normalizedLabel === normalizedName || normalizedLabel.includes(` ${normalizedName} `) || normalizedLabel.startsWith(`${normalizedName} `) || normalizedLabel.endsWith(` ${normalizedName}`);
	});
};
