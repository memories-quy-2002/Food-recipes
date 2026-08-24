import { useEffect, useMemo, useState } from "react";
import { useRecipesQuery } from "@/features/food/api/useRecipesQuery";
import { useAllRecipesQuery } from "@/features/recipes/api/useRecipeQueries";
import type { RecipeSummary } from "@/shared/api/contracts";
import { useSavedRecipeIdsQuery } from "../api/planningQueries";

const MIN_SEARCH_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 250;

type RecipePickerProps = {
	selectedRecipeId: number | null;
	onSelect: (recipe: RecipeSummary) => void;
	autoFocus?: boolean;
};

const RecipeOption = ({
	recipe,
	selectedRecipeId,
	onSelect,
}: {
	recipe: RecipeSummary;
	selectedRecipeId: number | null;
	onSelect: (recipe: RecipeSummary) => void;
}) => (
	<button
		type="button"
		className={`planning-recipe-picker__option${selectedRecipeId === recipe.recipe_id ? " is-selected" : ""}`}
		onClick={() => onSelect(recipe)}
		aria-pressed={selectedRecipeId === recipe.recipe_id}
	>
		<span>{recipe.recipe_name}</span>
		{selectedRecipeId === recipe.recipe_id && <span aria-hidden="true">✓</span>}
	</button>
);

const RecipePicker = ({ selectedRecipeId, onSelect, autoFocus = false }: RecipePickerProps) => {
	const [searchTerm, setSearchTerm] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const savedRecipeIdsQuery = useSavedRecipeIdsQuery();
	const allRecipesQuery = useAllRecipesQuery();

	useEffect(() => {
		const timer = window.setTimeout(
			() => setDebouncedSearch(searchTerm.trim()),
			SEARCH_DEBOUNCE_MS,
		);
		return () => window.clearTimeout(timer);
	}, [searchTerm]);

	const discoveryState = {
		q: debouncedSearch,
		categoryId: "",
		mealId: "",
		sort: "popular" as const,
		page: 1,
		limit: 8,
	};
	const discoveryQuery = useRecipesQuery(discoveryState, {
		enabled: debouncedSearch.length >= MIN_SEARCH_LENGTH,
	});

	const savedRecipeIds = savedRecipeIdsQuery.data ?? [];
	const savedRecipes = useMemo(() => {
		const savedIds = new Set(savedRecipeIds);
		return (allRecipesQuery.data ?? []).filter((recipe) => savedIds.has(recipe.recipe_id));
	}, [allRecipesQuery.data, savedRecipeIds]);

	return (
		<div className="planning-recipe-picker">
			<section aria-labelledby="saved-recipe-picker-title">
				<div className="planning-recipe-picker__section-heading">
					<h3 id="saved-recipe-picker-title">Saved recipes</h3>
					<span>{savedRecipes.length}</span>
				</div>
				{savedRecipeIdsQuery.isPending || allRecipesQuery.isPending ? (
					<p className="planning-recipe-picker__hint">Loading your saved recipes…</p>
				) : savedRecipes.length === 0 ? (
					<p className="planning-recipe-picker__hint">Save a recipe first, or search the recipe library below.</p>
				) : (
					<div className="planning-recipe-picker__options">
						{savedRecipes.map((recipe) => (
							<RecipeOption
								key={recipe.recipe_id}
									recipe={recipe}
									selectedRecipeId={selectedRecipeId}
								onSelect={onSelect}
							/>
							))}
					</div>
				)}
			</section>

			<section className="planning-recipe-picker__search" aria-labelledby="discover-recipe-picker-title">
				<h3 id="discover-recipe-picker-title">Find another recipe</h3>
				<label htmlFor="planning-recipe-search">Search recipes</label>
				<input
					id="planning-recipe-search"
					name="recipeSearch"
					type="search"
					placeholder="Try chicken, pasta, soup…"
					value={searchTerm}
					onChange={(event) => setSearchTerm(event.target.value)}
					autoFocus={autoFocus}
					autoComplete="off"
				/>
				{debouncedSearch.length < MIN_SEARCH_LENGTH ? (
					<p className="planning-recipe-picker__hint">Type at least 2 characters to search the library.</p>
				) : discoveryQuery.isPending ? (
					<p className="planning-recipe-picker__hint" role="status">Searching recipes…</p>
				) : discoveryQuery.error ? (
					<p className="planning-recipe-picker__hint" role="alert">Recipe search is unavailable. Try again.</p>
				) : (
					<div className="planning-recipe-picker__options" aria-label="Recipe search results">
						{(discoveryQuery.data?.recipes ?? []).map((recipe) => (
							<RecipeOption
								key={recipe.recipe_id}
								recipe={recipe}
								selectedRecipeId={selectedRecipeId}
								onSelect={onSelect}
							/>
						))}
						{discoveryQuery.data?.recipes.length === 0 && (
							<p className="planning-recipe-picker__hint">No recipes match that search.</p>
						)}
					</div>
				)}
			</section>
		</div>
	);
};

export default RecipePicker;
