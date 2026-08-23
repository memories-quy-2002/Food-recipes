import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import FoodContentPagination, { getPaginationPageNumbers } from "./FoodContentPagination";

describe("FoodContentPagination", () => {
	it("keeps the existing compact list for small totals", () => {
		expect(getPaginationPageNumbers(5, 3)).toEqual([1, 2, 3, 4, 5]);
	});

	it("only creates nearby page numbers for large totals", () => {
		expect(getPaginationPageNumbers(1_000_000, 1)).toEqual([1, 2, 3, 4, 5]);
		expect(getPaginationPageNumbers(1_000_000, 500_000)).toEqual([499_998, 499_999, 500_000, 500_001, 500_002]);
		expect(getPaginationPageNumbers(1_000_000, 1_000_000)).toEqual([999_996, 999_997, 999_998, 999_999, 1_000_000]);
	});

	it("renders a bounded nearby window and keeps the active page visible", () => {
		const onPagination = vi.fn();
		let renderer;
		act(() => {
			renderer = TestRenderer.create(
				<FoodContentPagination
					recipesPerPage={20}
				totalRecipes={20_000_000}
				totalPages={1_000_000}
				onPagination={onPagination}
				currentPage={500_000}
			/>
		);
		});

		expect(renderer.root.findAll((node) => node.props?.active === true)).toHaveLength(1);
		expect(renderer.root.findAllByType("a")).toHaveLength(8);
	});
});
