import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import RecipeRating from "./RecipeRating";

const baseProps = {
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
	canDeleteReview: true,
	isSubmittingReview: false,
	isDeletingReview: false,
	onSubmit: vi.fn(),
	onDelete: vi.fn(),
	onStarClick: vi.fn(),
	onToggleReview: vi.fn(),
	onReviewChange: vi.fn(),
};

describe("recipe rating Task 15", () => {
	it("explains why the recipe author cannot rate their own recipe", () => {
		let renderer;
		act(() => {
			renderer = TestRenderer.create(
				<RecipeRating {...baseProps} isRecipeAuthor />
			);
		});

		expect(renderer.root.findByType("strong").children.join(" ")).toContain(
			"cannot review your own recipe"
		);
		expect(renderer.root.findAllByType("form")).toHaveLength(0);
	});

	it("shows update and delete controls only for the authenticated user's existing review", () => {
		let renderer;
		act(() => {
			renderer = TestRenderer.create(
				<RecipeRating {...baseProps} hasExistingRating />
			);
		});

		expect(renderer.root.findByProps({ children: "Update review" })).toBeTruthy();
		expect(renderer.root.findByProps({ children: "Delete my review" })).toBeTruthy();

		act(() => {
			renderer.update(<RecipeRating {...baseProps} />);
		});
		expect(renderer.root.findAllByProps({ children: "Delete my review" })).toHaveLength(0);
	});

	it("keeps the 500-character review boundary on the textarea", () => {
		let renderer;
		act(() => {
			renderer = TestRenderer.create(<RecipeRating {...baseProps} />);
		});

		const textarea = renderer.root.findByType("textarea");
		expect(textarea.props.maxLength).toBe(500);
	});
});
