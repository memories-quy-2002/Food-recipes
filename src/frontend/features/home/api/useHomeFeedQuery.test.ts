import { describe, expect, it } from "vitest";
import { apiRoutes } from "@/shared/api/routes";
import { createHomeFeedQueryKey, getHomeFeedRoute } from "./useHomeFeedQuery";

describe("home feed query contract", () => {
	it("separates public and personalized cache entries", () => {
		expect(createHomeFeedQueryKey(false)).toEqual(["home-feed", "public"]);
		expect(createHomeFeedQueryKey(true)).toEqual(["home-feed", "personalized"]);
	});

	it("uses the authenticated endpoint only for signed-in users", () => {
		expect(getHomeFeedRoute(false)).toBe(apiRoutes.homeFeed);
		expect(getHomeFeedRoute(true)).toBe(apiRoutes.userHomeFeed);
	});

	it("exposes the authenticated not-interested recommendation route", () => {
		expect(apiRoutes.userRecommendationNotInterested(42)).toBe(
			"/users/me/recommendations/not-interested/42",
		);
	});
});
