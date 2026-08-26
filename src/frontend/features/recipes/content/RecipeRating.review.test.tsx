import TestRenderer, { act, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
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

describe("recipe rating review flow", () => {
	it("explains why the recipe author cannot rate their own recipe", () => {
		let renderer: ReactTestRenderer | undefined;
		act(() => {
			renderer = TestRenderer.create(
				<RecipeRating {...baseProps} isRecipeAuthor />
			);
		});
		if (!renderer) throw new Error("Expected the rating renderer");

		expect(renderer.root.findByType("strong").children.join(" ")).toContain(
			"cannot review your own recipe"
		);
		expect(renderer.root.findAllByType("form")).toHaveLength(0);
	});

	it("shows update and delete controls only for the authenticated user's existing review", () => {
		let renderer: ReactTestRenderer | undefined;
		act(() => {
			renderer = TestRenderer.create(
				<RecipeRating {...baseProps} hasExistingRating />
			);
		});
		if (!renderer) throw new Error("Expected the rating renderer");
		const rendered = renderer;

		expect(renderer.root.findByProps({ children: "Update review" })).toBeTruthy();
		expect(renderer.root.findByProps({ children: "Delete my review" })).toBeTruthy();

		act(() => {
			rendered.update(<RecipeRating {...baseProps} />);
		});
		expect(rendered.root.findAllByProps({ children: "Delete my review" })).toHaveLength(0);
	});

	it("keeps the 500-character review boundary on the textarea", () => {
		let renderer: ReactTestRenderer | undefined;
		act(() => {
			renderer = TestRenderer.create(<RecipeRating {...baseProps} />);
		});
		if (!renderer) throw new Error("Expected the rating renderer");

		const textarea = renderer.root.findByType("textarea");
		expect(textarea.props.maxLength).toBe(500);
	});

	it("uses native buttons for keyboard-accessible star selection", () => {
		let renderer: ReactTestRenderer | undefined;
		act(() => {
			renderer = TestRenderer.create(<RecipeRating {...baseProps} />);
		});
		if (!renderer) throw new Error("Expected the rating renderer");

		const starButtons = renderer.root.findAll(
			(node: ReactTestInstance) =>
				node.type === "button" &&
				typeof node.props["aria-label"] === "string" &&
				node.props["aria-label"].startsWith("Rate ")
		);

		expect(starButtons).toHaveLength(5);
		expect(starButtons.every((button: ReactTestInstance) => button.props.type === "button")).toBe(
			true
		);
	});
});
