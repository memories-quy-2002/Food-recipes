import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import FoodContentPagination from "./content/FoodContentPagination";
import FoodContentSection from "./content/FoodContentSection";
import FoodContentSectionItem from "./content/FoodContentSectionItem";

const FoodContent = ({ recipes, categoryId, mealId, searchTerm }) => {
	const ITEMS_PER_PAGE = 9;
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

	let categories = filteredRecipes
		.map(({ category_id: id, category_name: name }) => ({ id, name }))
		.filter(
			(category, index, self) =>
				index === self.findIndex((c) => c.id === category.id)
		)
		.sort((a, b) => a.id - b.id);

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
	console.log(currentRecipes);
	return (
		<div className="food__content">
			<div className="food__content__button">
				<button type="button" onClick={handleNavigate}>
					Add new recipe +
				</button>
			</div>
			<div style={{ height: "fit-content" }}>
				{categoryId || mealId ? (
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
				)}
			</div>

			{categoryId
				? filteredRecipes.length > ITEMS_PER_PAGE && (
						<FoodContentPagination
							recipesPerPage={ITEMS_PER_PAGE}
							totalRecipes={currentRecipes.length}
							onPagination={handlePagination}
							currentPage={currentPage}
						/>
				  )
				: filteredRecipes.length > ITEMS_PER_PAGE && (
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
