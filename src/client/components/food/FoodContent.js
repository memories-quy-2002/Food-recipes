import React from "react";
import { useNavigate } from "react-router-dom";
import FoodContentSection from "./content/FoodContentSection";
import FoodContentSectionItem from "./content/FoodContentSectionItem";

const FoodContent = ({ recipes, categoryId, mealId }) => {
	const navigate = useNavigate();
	const handleNavigate = () => {
		navigate("/food/add");
	};
	if (mealId) {
		recipes = recipes.filter(
			(recipe) => recipe.meal_id === parseInt(mealId)
		);
	}
	let categories = recipes
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

	return (
		<div className="food__content">
			<div className="food__content__button">
				<button type="button" onClick={handleNavigate}>
					Add new recipe +{" "}
				</button>
			</div>
			{categoryId || mealId ? (
				categories.map(({ id, name }) => (
					<FoodContentSection
						key={id}
						id={id}
						name={name}
						recipes={recipes}
					/>
				))
			) : (
				<div className="food__content__section__list">
					{recipes.map((recipe, index) => (
						<FoodContentSectionItem key={index} recipe={recipe} />
					))}
				</div>
			)}
		</div>
	);
};

export default FoodContent;
