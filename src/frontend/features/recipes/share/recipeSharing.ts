export type ShareRecipePayload = {
	title: string;
	text?: string;
	url: string;
};

export type ShareResult = "shared" | "copied" | "cancelled";

type ShareNavigator = {
	share?: Navigator["share"];
	clipboard?: Pick<Clipboard, "writeText">;
};

export type ShareBrowser = {
	navigator?: ShareNavigator;
};

export function buildRecipeShareUrl(recipeId: number | string, origin: string): string {
	return new URL(`/recipe?id=${encodeURIComponent(recipeId)}`, origin).toString();
}

export async function shareRecipe(
	{ title, text, url }: ShareRecipePayload,
	browser: ShareBrowser = window,
): Promise<ShareResult> {
	const share = browser.navigator?.share;
	if (typeof share === "function") {
		const navigator = browser.navigator;
		if (!navigator) throw new Error("SHARE_UNAVAILABLE");
		try {
			await share.call(navigator, { title, text, url });
			return "shared";
		} catch (error) {
			if (
				typeof error === "object" &&
				error !== null &&
				"name" in error &&
				error.name === "AbortError"
			) {
				return "cancelled";
			}
			throw error;
		}
	}

	const writeText = browser.navigator?.clipboard?.writeText;
	if (typeof writeText === "function") {
		await writeText.call(browser.navigator?.clipboard, url);
		return "copied";
	}

	throw new Error("SHARE_UNAVAILABLE");
}
