export function buildRecipeShareUrl(recipeId, origin) {
	return new URL(`/recipe?id=${encodeURIComponent(recipeId)}`, origin).toString();
}

export async function shareRecipe({ title, text, url }, browser = window) {
	const share = browser.navigator?.share;
	if (typeof share === "function") {
		try {
			await share.call(browser.navigator, { title, text, url });
			return "shared";
		} catch (error) {
			if (error?.name === "AbortError") {
				return "cancelled";
			}
			throw error;
		}
	}

	const writeText = browser.navigator?.clipboard?.writeText;
	if (typeof writeText === "function") {
		await writeText.call(browser.navigator.clipboard, url);
		return "copied";
	}

	throw new Error("SHARE_UNAVAILABLE");
}
