import { describe, expect, it } from "vitest";
import {
	getOptimizedImageUrl,
	getResponsiveImageSrcSet,
} from "./convertImage";

describe("Supabase image delivery", () => {
	const publicUrl =
		"https://project.supabase.co/storage/v1/object/public/recipe-images/pasta/photo.jpg";

	it("converts public storage URLs to cached image transformations", () => {
		const optimized = new URL(getOptimizedImageUrl(publicUrl, { width: 800 }));

		expect(optimized.pathname).toBe(
			"/storage/v1/render/image/public/recipe-images/pasta/photo.jpg"
		);
		expect(optimized.searchParams.get("width")).toBe("800");
		expect(optimized.searchParams.get("quality")).toBe("80");
	});

	it("creates responsive sources for the CDN", () => {
		const srcSet = getResponsiveImageSrcSet(publicUrl);

		expect(srcSet).toContain(" 400w");
		expect(srcSet).toContain(" 800w");
		expect(srcSet).toContain(" 1200w");
	});

	it("leaves non-Supabase images unchanged", () => {
		const externalUrl = "https://images.example.com/photo.jpg";

		expect(getOptimizedImageUrl(externalUrl)).toBe(externalUrl);
		expect(getResponsiveImageSrcSet(externalUrl)).toBeUndefined();
	});
});
