// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RecipeContent from "./RecipeContent";

vi.mock("./content/RecipeDescription", () => ({ default: () => <div data-testid="recipe-description" /> }));
vi.mock("./RecipeMetadataPanel", () => ({ default: () => <div data-testid="recipe-metadata" /> }));
vi.mock("./content/RecipeRating", () => ({ default: () => <div data-testid="recipe-rating" /> }));

describe("RecipeContent hierarchy", () => {
	it("groups cooking content, supporting details, and community content", () => {
		render(
			<RecipeContent
				recipe={{ recipe_id: 7, metadata: null }}
				isAuthenticated={false}
				ratingScore={0}
				showReview={false}
				review=""
				reviewList={[]}
				reviewMessage={null}
				hasExistingRating={false}
				isRecipeAuthor={false}
				canMutateReview={false}
				canDeleteReview={false}
				isLoadingReviews={false}
				reviewsError={null}
				isSubmittingReview={false}
				isDeletingReview={false}
				onSubmit={vi.fn()}
				onDelete={vi.fn()}
				onStarClick={vi.fn()}
				onToggleReview={vi.fn()}
				onReviewChange={vi.fn()}
			/>,
		);

		expect(screen.getByTestId("recipe-cooking-core").contains(screen.getByTestId("recipe-description"))).toBe(true);
		expect(screen.getByTestId("recipe-supporting-details").contains(screen.getByTestId("recipe-metadata"))).toBe(true);
		expect(screen.queryByRole("heading", { name: "Recipe suggestions" })).toBeNull();
		expect(screen.getByTestId("recipe-community").contains(screen.getByTestId("recipe-rating"))).toBe(true);
	});
});
