// @vitest-environment jsdom

import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PageHelmet from "./PageHelmet";

const siteUrl = import.meta.env.VITE_SITE_URL || "https://foodrecipes1.vercel.app";

describe("PageHelmet", () => {
	it("updates the document head and removes stale noindex metadata", () => {
		const { rerender } = render(
			<PageHelmet
				title="Mango Coconut Chia Pudding"
				description="A tropical pudding recipe."
				path="/recipe?id=3"
				noIndex
			/>
		);

		expect(document.title).toBe("Mango Coconut Chia Pudding | Food Recipes");
		expect(
			document.head
				.querySelector('meta[name="description"]')
				?.getAttribute("content")
		).toBe("A tropical pudding recipe.");
		expect(
			document.head.querySelector('meta[name="robots"]')?.getAttribute("content")
		).toBe("noindex,nofollow");
		expect(
				document.head
					.querySelector('link[rel="canonical"]')
					?.getAttribute("href")
		).toBe(`${siteUrl}/recipe?id=3`);

		rerender(<PageHelmet title="Home" path="/" />);

		expect(document.title).toBe("Home | Food Recipes");
		expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
	});
});
