// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

const { useHomeFeedQueryMock } = vi.hoisted(() => ({
	useHomeFeedQueryMock: vi.fn(),
}));
const { useDismissRecommendationMutationMock } = vi.hoisted(() => ({
	useDismissRecommendationMutationMock: vi.fn(),
}));

vi.mock("./api/useHomeFeedQuery", () => ({
	useHomeFeedQuery: useHomeFeedQueryMock,
}));

vi.mock("./KitchenCommandCenter", () => ({
	default: () => (
		<section aria-labelledby="mock-kitchen-command-center-title">
			<h2 id="mock-kitchen-command-center-title">Kitchen command center</h2>
		</section>
	),
}));
vi.mock("../recommendations/api/recommendationsQueries", () => ({
	useDismissRecommendationMutation: useDismissRecommendationMutationMock,
}));

import PersonalizedHomeFeed from "./PersonalizedHomeFeed";

const createRecipe = (overrides: Record<string, unknown> = {}) => ({
	recipe_id: 7,
	recipe_name: "Pantry pasta",
	recipe_description: null,
	prep_time_minutes: 10,
	cook_time_minutes: 15,
	total_time_minutes: 25,
	date_added: null,
	image_url: null,
	user_id: 1,
	meal_id: 1,
	meal_name: "Dinner",
	category_id: 1,
	category_name: "Pasta",
	overall_score: 4.5,
	num_ratings: 4,
	dietary_tags: [],
	...overrides,
});

const createQueryState = (sections: unknown[], kitchen?: unknown) => ({
	data: {
		personalized: true,
		sections,
		...(kitchen === undefined ? {} : { kitchen }),
	},
	isLoading: false,
	isError: false,
	refetch: vi.fn(),
});

const renderFeed = (): void => {
	render(
		<MemoryRouter>
			<PersonalizedHomeFeed
				isAuthenticated
				wishlist={[]}
				onClickFavorite={vi.fn()}
			/>
		</MemoryRouter>,
	);
};

describe("PersonalizedHomeFeed accessibility", () => {
	beforeEach(() => {
		useHomeFeedQueryMock.mockReset();
		useDismissRecommendationMutationMock.mockReturnValue({ mutate: vi.fn(), isPending: false });
	});

	afterEach(cleanup);

	it("renders recommendation reasons, time, rating, and pantry relevance", () => {
		useHomeFeedQueryMock.mockReturnValue(
			createQueryState([{
				key: "recommended",
				title: "For you tonight",
				description: "Recipes shaped by your cooking signals.",
				recipes: [createRecipe({
					recipe_name: "Chicken Teriyaki",
					total_time_minutes: 24,
					overall_score: 4.8,
					num_ratings: 12,
					pantry_match_count: 7,
					reasons: ["Matches your high-protein preference."],
				})],
			}],),
		);

		renderFeed();

		expect(screen.getByRole("region", { name: "For you tonight" })).toBeInTheDocument();
		expect(screen.getByText("Matches your high-protein preference.")).toBeInTheDocument();
		expect(screen.getByText("Uses 7 ingredients from your pantry")).toBeInTheDocument();
		expect(screen.getByText("24 min")).toBeInTheDocument();
		expect(screen.getByLabelText("4.8 out of 5 from 12 ratings")).toBeInTheDocument();
	});

	it("keeps fallback sections usable when recommendations are empty", () => {
		useHomeFeedQueryMock.mockReturnValue(
			createQueryState([
				{ key: "continue", title: "Continue cooking", description: "Resume cooking.", recipes: [] },
				{ key: "use_soon", title: "Use soon", description: "Use available ingredients.", recipes: [createRecipe({ recipe_id: 1, recipe_name: "Use soon soup" })] },
				{ key: "recommended", title: "Recommended for you", description: "Personalized ideas.", recipes: [] },
				{ key: "planned", title: "On your plan next", description: "Prepare your next meal.", recipes: [createRecipe({ recipe_id: 2, recipe_name: "Planned rice" })] },
				{ key: "popular", title: "Explore what is popular", description: "Community favorites.", recipes: [createRecipe({ recipe_id: 3, recipe_name: "Popular curry" })] },
			],),
		);

		renderFeed();

		expect(screen.getByRole("heading", { name: "Use soon" })).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "On your plan next" })).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Explore what is popular" })).toBeInTheDocument();
		expect(screen.queryByRole("region", { name: "Recommended for you" })).not.toBeInTheDocument();
	});

	it("keeps the kitchen command center before feed recommendations", () => {
		useHomeFeedQueryMock.mockReturnValue(
			createQueryState(
				[{ key: "recommended", title: "Recommended for you", description: "Personalized ideas.", recipes: [createRecipe()] }],
				{
					active_session: null,
					next_meal: null,
					shopping: { open_items: 0, completed_items: 0 },
					pantry: { available_items: 0 },
					progress: { saved_recipes: 0, planned_meals: 0, completed_cooks: 0 },
				},
			),
		);

		renderFeed();

		const commandCenter = screen.getByRole("region", { name: "Kitchen command center" });
		const feedHeading = screen.getByRole("heading", { name: "Recipes that fit your kitchen" });
		expect(commandCenter.compareDocumentPosition(feedHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});

	it("keeps recipe links and save controls keyboard focusable", () => {
		useHomeFeedQueryMock.mockReturnValue(
			createQueryState([{
				key: "recommended",
				title: "Recommended for you",
				description: "Personalized ideas.",
				recipes: [createRecipe()],
			}],),
		);

		renderFeed();

		const recipeLink = screen.getByRole("link", { name: "Open Pantry pasta" });
		const saveButton = screen.getByRole("button", { name: "Save Pantry pasta" });
		recipeLink.focus();
		expect(document.activeElement).toBe(recipeLink);
		saveButton.focus();
		expect(document.activeElement).toBe(saveButton);
		expect(screen.getByRole("link", { name: "Update your pantry" })).toHaveAttribute("href", "/pantry");
		expect(screen.getByText("Pantry pasta")).toBeInTheDocument();
	});

	it("shows not-interested only for authenticated recommendations and invokes the callback", () => {
		const mutate = vi.fn();
		useDismissRecommendationMutationMock.mockReturnValue({ mutate, isPending: false });
		useHomeFeedQueryMock.mockReturnValue(createQueryState([{
			key: "recommended", title: "Recommended for you", description: "Personalized ideas.", recipes: [createRecipe()],
		}]));

		renderFeed();
		fireEvent.click(screen.getByRole("button", { name: "Not interested in Pantry pasta" }));
		expect(mutate).toHaveBeenCalledWith(7);

		cleanup();
		useHomeFeedQueryMock.mockReturnValue(createQueryState([{
			key: "recommended", title: "Recommended", description: "Ideas.", recipes: [createRecipe()],
		}]));
		render(<MemoryRouter><PersonalizedHomeFeed isAuthenticated={false} wishlist={[]} onClickFavorite={vi.fn()} /></MemoryRouter>);
		expect(screen.queryByRole("button", { name: "Not interested in Pantry pasta" })).not.toBeInTheDocument();
	});

	it("disables the not-interested action while dismissal is pending", () => {
		const mutate = vi.fn();
		useDismissRecommendationMutationMock.mockReturnValue({ mutate, isPending: true });
		useHomeFeedQueryMock.mockReturnValue(createQueryState([{
			key: "recommended", title: "Recommended", description: "Ideas.", recipes: [createRecipe()],
		}]));

		renderFeed();
		const action = screen.getByRole("button", { name: "Hiding Pantry pasta" });
		expect(action).toBeDisabled();
		expect(action).toHaveAttribute("aria-busy", "true");
		fireEvent.click(action);
		expect(mutate).not.toHaveBeenCalled();
	});
});
