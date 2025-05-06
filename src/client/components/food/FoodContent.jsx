import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import FoodContentPagination from "./content/FoodContentPagination";
import FoodContentSection from "./content/FoodContentSection";
import FoodContentSectionItem from "./content/FoodContentSectionItem";

const ITEMS_PER_PAGE = 6;

const FoodContent = ({ recipes, categoryId, mealId, searchTerm }) => {
	const navigate = useNavigate();
	const [currentPage, setCurrentPage] = useState(1);

	const handleNavigate = () => {
		navigate("/food/add");
	};

	let filteredRecipes = [...recipes];

	if (mealId) {
		filteredRecipes = filteredRecipes.filter(
			(recipe) => recipe.meal_id === parseInt(mealId)
		);
	}
	if (searchTerm) {
		filteredRecipes = filteredRecipes.filter((recipe) =>
			recipe.recipe_name.toLowerCase().includes(searchTerm.toLowerCase())
		);
	}

	let categories = Array.from(
		new Map(
			filteredRecipes.map(({ category_id: id, category_name: name }) => [
				id,
				{ id, name },
			])
		).values()
	).sort((a, b) => a.id - b.id);

	if (categoryId) {
		categories = categories.filter(
			(category) => category.id === parseInt(categoryId)
		);
	}

	const indexOfLastRecipe = currentPage * ITEMS_PER_PAGE;
	const indexOfFirstRecipe = indexOfLastRecipe - ITEMS_PER_PAGE;
	const currentRecipes = filteredRecipes.slice(
		indexOfFirstRecipe,
		indexOfLastRecipe
	);

	const handlePagination = (pageNumber) => {
		setCurrentPage(pageNumber);
	};
	return (
		<div className="food__content">
			<div className="food__content__button">
				<button type="button" onClick={handleNavigate}>
					Add new recipe +
				</button>
			</div>
			<div style={{ height: "fit-content" }}>
				{filteredRecipes.length > 0 ? (
					categoryId || mealId ? (
						categories.map(({ id, name }) => (
							<FoodContentSection
								key={id}
								id={id}
								name={name}
								recipes={filteredRecipes}
							/>
						))
					) : (
						<div className="food__content__section__list">
							{currentRecipes.map((recipe, index) => (
								<FoodContentSectionItem
									key={index}
									recipe={recipe}
								/>
							))}
						</div>
					)
				) : (
					"No recipe found"
				)}
			</div>
			{!categoryId &&
				!mealId &&
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
