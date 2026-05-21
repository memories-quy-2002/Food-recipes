import React, { useEffect, useMemo, useState } from "react";
import { BsGrid3X3Gap, BsListUl, BsPlusLg } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import FoodContentPagination from "./content/FoodContentPagination";
import FoodContentSection from "./content/FoodContentSection";
import FoodContentSectionItem from "./content/FoodContentSectionItem";

const ITEMS_PER_PAGE = 6;

const sortRecipes = (recipes, sortBy) => {
	const sortedRecipes = [...recipes];

	if (sortBy === "name") {
		return sortedRecipes.sort((a, b) =>
			a.recipe_name.localeCompare(b.recipe_name)
		);
	}

	if (sortBy === "rating") {
		return sortedRecipes.sort(
			(a, b) => Number(b.overall_score || 0) - Number(a.overall_score || 0)
		);
	}

	return sortedRecipes.sort(
		(a, b) => Number(b.num_ratings || 0) - Number(a.num_ratings || 0)
	);
};

const FoodContent = ({ recipes, categoryId, mealId, searchTerm }) => {
	const navigate = useNavigate();
	const [currentPage, setCurrentPage] = useState(1);
	const [sortBy, setSortBy] = useState("popular");
	const [viewMode, setViewMode] = useState("grid");

	const filteredRecipes = useMemo(() => {
		const normalizedSearch = searchTerm.trim().toLowerCase();
		let nextRecipes = [...recipes];

		if (categoryId) {
			nextRecipes = nextRecipes.filter(
				(recipe) => recipe.category_id === parseInt(categoryId, 10)
			);
		}

		if (mealId) {
			nextRecipes = nextRecipes.filter(
				(recipe) => recipe.meal_id === parseInt(mealId, 10)
			);
		}

		if (normalizedSearch) {
			nextRecipes = nextRecipes.filter((recipe) =>
				recipe.recipe_name.toLowerCase().includes(normalizedSearch)
			);
		}

		return sortRecipes(nextRecipes, sortBy);
	}, [recipes, categoryId, mealId, searchTerm, sortBy]);

	const categories = useMemo(
		() =>
			Array.from(
				new Map(
					filteredRecipes.map(
						({ category_id: id, category_name: name }) => [
							id,
							{ id, name },
						]
					)
				).values()
			).sort((a, b) => a.id - b.id),
		[filteredRecipes]
	);

	useEffect(() => {
		setCurrentPage(1);
	}, [categoryId, mealId, searchTerm, sortBy]);

	const handleNavigate = () => {
		navigate("/food/add");
	};

	const indexOfLastRecipe = currentPage * ITEMS_PER_PAGE;
	const indexOfFirstRecipe = indexOfLastRecipe - ITEMS_PER_PAGE;
	const currentRecipes = filteredRecipes.slice(
		indexOfFirstRecipe,
		indexOfLastRecipe
	);

	const handlePagination = (pageNumber) => {
		setCurrentPage(pageNumber);
	};

	const shouldGroupByCategory = Boolean(categoryId || mealId);
	const listClassName = `food__content__section__list food__content__section__list--${viewMode}`;

	return (
		<div className="food__content">
			<div className="food__content__toolbar">
				<div>
					<span className="food__content__toolbar__eyebrow">Results</span>
					<h2>{filteredRecipes.length} recipes found</h2>
				</div>
				<div className="food__content__toolbar__actions">
					<label>
						Sort
						<select
							value={sortBy}
							onChange={(event) => setSortBy(event.target.value)}
						>
							<option value="popular">Most rated</option>
							<option value="rating">Highest score</option>
							<option value="name">Name A-Z</option>
						</select>
					</label>
					<div className="food__content__view" aria-label="Recipe view mode">
						<button
							type="button"
							className={viewMode === "grid" ? "active" : ""}
							onClick={() => setViewMode("grid")}
							aria-label="Grid view"
						>
							<BsGrid3X3Gap />
						</button>
						<button
							type="button"
							className={viewMode === "list" ? "active" : ""}
							onClick={() => setViewMode("list")}
							aria-label="List view"
						>
							<BsListUl />
						</button>
					</div>
					<button
						type="button"
						className="food__content__add"
						onClick={handleNavigate}
					>
						<BsPlusLg />
						Add recipe
					</button>
				</div>
			</div>

			{filteredRecipes.length > 0 ? (
				shouldGroupByCategory ? (
					categories.map(({ id, name }) => (
						<FoodContentSection
							key={id}
							id={id}
							name={name}
							recipes={filteredRecipes}
							viewMode={viewMode}
						/>
					))
				) : (
					<div className={listClassName}>
						{currentRecipes.map((recipe) => (
							<FoodContentSectionItem
								key={recipe.recipe_id}
								recipe={recipe}
							/>
						))}
					</div>
				)
			) : (
				<div className="food__content__empty">
					<h3>No recipes found</h3>
					<p>Try another search term or clear one of the filters.</p>
				</div>
			)}

			{!shouldGroupByCategory &&
				filteredRecipes.length > ITEMS_PER_PAGE && (
					<FoodContentPagination
						recipesPerPage={ITEMS_PER_PAGE}
						totalRecipes={filteredRecipes.length}
						onPagination={handlePagination}
						currentPage={currentPage}
					/>
				)}
		</div>
	);
};

export default FoodContent;
