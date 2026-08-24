import { describe, expect, expectTypeOf, it } from "vitest";
import type { RecipeListResponse } from "@/shared/api/contracts";
import {
	HOME_SEARCH_LIMIT,
	HOME_SEARCH_MIN_LENGTH,
	HOME_SEARCH_DEBOUNCE_MS,
	createHomeSearchQueryKey,
	createHomeSearchRequestParams,
	shouldSearchRecipes,
	useHomeSearchQuery,
} from "./useHomeSearchQuery";

describe("home recipe search query", () => {
	it("requires a trimmed two-character query before requesting suggestions", () => {
		expect(shouldSearchRecipes("a")).toBe(false);
		expect(shouldSearchRecipes("  ")).toBe(false);
		expect(shouldSearchRecipes(" ch")).toBe(true);
	});

	it("uses a bounded server request and stable query key", () => {
		expect(createHomeSearchRequestParams("  chick ")).toEqual({ q: "chick", limit: HOME_SEARCH_LIMIT });
		expect(createHomeSearchQueryKey("  chick ")).toEqual(["home-recipe-search", "chick"]);
	});

	it("documents the debounce and typed response contract", () => {
		expect(HOME_SEARCH_MIN_LENGTH).toBe(2);
		expect(HOME_SEARCH_DEBOUNCE_MS).toBe(250);
		expectTypeOf<ReturnType<typeof useHomeSearchQuery>['data']>().toEqualTypeOf<RecipeListResponse | undefined>();
	});
});
