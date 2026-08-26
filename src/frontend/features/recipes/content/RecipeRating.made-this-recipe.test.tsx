import React from "react";
import TestRenderer, { act, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import RecipeRating from "./RecipeRating";
import RecipeReviewList from "./RecipeReviewList";

const ratingProps = {
	ratingScore: 4,
	review: "Good recipe",
	reviewList: [],
	reviewMessage: null,
	hasExistingRating: false,
	isLoadingReviews: false,
	reviewsError: null,
	showReview: true,
	isAuthenticated: true,
	isRecipeAuthor: false,
	canMutateReview: true,
	canDeleteReview: true,
	isSubmittingReview: false,
	isDeletingReview: false,
	onSubmit: vi.fn(),
	onDelete: vi.fn(),
	onStarClick: vi.fn(),
	onToggleReview: vi.fn(),
	onReviewChange: vi.fn(),
};

describe("made-this-recipe contract behavior", () => {
	it("does not render an unsupported checkbox in the review form", () => {
		let renderer: ReactTestRenderer | undefined;
		act(() => {
			renderer = TestRenderer.create(<RecipeRating {...ratingProps} />);
		});
		if (!renderer) throw new Error("Expected the rating renderer");

		expect(renderer.root.findAllByType("input")).toHaveLength(0);
		expect(renderer.root.findAll((node: ReactTestInstance) =>
			node.children?.join?.(" ").includes("I made this recipe")
		)).toHaveLength(0);
	});

	it("does not display an untrusted indicator when review data has no supported boolean", () => {
		let renderer: ReactTestRenderer | undefined;
		act(() => {
			renderer = TestRenderer.create(
				<RecipeReviewList
					reviewList={[
						{
							rating_id: 1,
							score: 5,
							review: "Excellent",
							full_name: "Ava Cook",
							date_added: "2026-08-23T10:00:00.000Z",
						},
					]}
				/>
			);
		});
		if (!renderer) throw new Error("Expected the review renderer");

		expect(renderer.root.findAll((node: ReactTestInstance) =>
			node.children?.join?.(" ").includes("Made this recipe")
		)).toHaveLength(0);
	});
});
