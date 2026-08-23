import React, { useMemo, useState } from "react";
import { BsGrid3X3Gap, BsListUl, BsPlusLg } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import FoodContentPagination from "./content/FoodContentPagination";
import FoodContentSection from "./content/FoodContentSection";
import FoodContentSectionItem from "./content/FoodContentSectionItem";

export const sortRecipes = (recipes, sortBy) => {
	const sortedRecipes = [...recipes];
	if (sortBy === "name") return sortedRecipes.sort((a, b) => a.recipe_name.localeCompare(b.recipe_name));
	if (sortBy === "rating") return sortedRecipes.sort((a, b) => Number(b.overall_score || 0) - Number(a.overall_score || 0));
	return sortedRecipes.sort((a, b) => Number(b.num_ratings || 0) - Number(a.num_ratings || 0));
};

export const getVisibleRecipes = (recipes, { page, limit }) => recipes.slice((page - 1) * limit, page * limit);

export const getRecipeContentState = (recipes, { page, limit }) => ({
	isEmpty: recipes.length === 0,
	totalPages: Math.max(1, Math.ceil(recipes.length / limit)),
});

const LoadingSkeleton = () => (
	<div className="food__content__loading" aria-busy="true" aria-label="Loading recipes">
		{Array.from({ length: 6 }, (_, index) => <div className="food__content__skeleton" key={index} />)}
	</div>
);

const FoodContent = ({ recipes = [], queryState, onQueryStateChange, isLoading = false, isFetching = false, error = null }) => {
	const navigate = useNavigate();
	const [viewMode, setViewMode] = useState("grid");
	const sortedRecipes = useMemo(() => sortRecipes(recipes, queryState.sort), [recipes, queryState.sort]);
	const visibleRecipes = getVisibleRecipes(sortedRecipes, queryState);
	const categories = useMemo(() => Array.from(new Map(visibleRecipes.map(({ category_id: id, category_name: name }) => [id, { id, name }])).values()).sort((a, b) => a.id - b.id), [visibleRecipes]);
	const shouldGroupByCategory = Boolean(queryState.categoryId || queryState.mealId);
	const listClassName = `food__content__section__list food__content__section__list--${viewMode}`;

	return (
		<div className="food__content" aria-live="polite" aria-busy={isFetching}>
			<div className="food__content__toolbar">
				<div>
					<span className="food__content__toolbar__eyebrow">Results</span>
					<h2>{isLoading ? "Loading recipes" : `${recipes.length} recipes found`}</h2>
				</div>
				<div className="food__content__toolbar__actions">
					<label>Sort<select value={queryState.sort} onChange={(event) => onQueryStateChange({ sort: event.target.value, page: 1 })}>
						<option value="popular">Most rated</option><option value="rating">Highest score</option><option value="name">Name A-Z</option>
					</select></label>
					<div className="food__content__view" aria-label="Recipe view mode">
						<button type="button" className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")} aria-label="Grid view"><BsGrid3X3Gap /></button>
						<button type="button" className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")} aria-label="List view"><BsListUl /></button>
					</div>
					<button type="button" className="food__content__add" onClick={() => navigate("/food/add")}><BsPlusLg />Add recipe</button>
				</div>
			</div>
			{isFetching && !isLoading && <div className="food__content__updating" role="status" aria-live="polite">Updating recipes…</div>}

			{isLoading ? <LoadingSkeleton /> : error ? (
				<div className="food__content__error"><h3>Recipe library could not load</h3><p>{error}</p></div>
			) : sortedRecipes.length === 0 ? (
				<div className="food__content__empty"><h3>No recipes found</h3><p>Try another search term or clear one of the filters.</p></div>
			) : shouldGroupByCategory ? (
				categories.map(({ id, name }) => <FoodContentSection key={id} id={id} name={name} recipes={visibleRecipes} viewMode={viewMode} />)
			) : (
				<div className={listClassName}>{visibleRecipes.map((recipe) => <FoodContentSectionItem key={recipe.recipe_id} recipe={recipe} />)}</div>
			)}

			{!isLoading && !error && sortedRecipes.length > queryState.limit && <FoodContentPagination recipesPerPage={queryState.limit} totalRecipes={sortedRecipes.length} onPagination={(page) => onQueryStateChange({ page })} currentPage={queryState.page} />}
		</div>
	);
};

export default FoodContent;
