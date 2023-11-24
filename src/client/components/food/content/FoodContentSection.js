import React from "react";
import FoodContentSectionItem from "./FoodContentSectionItem";

const FoodContentSection = ({ id, name, recipes }) => {
	return (
		<div key={id} className="food__content__section">
			<h4 className="food__content__section__title">{name}</h4>
			<div className="food__content__section__list">
				{recipes
					.sort((a, b) => b.num_ratings - a.num_ratings)
					.filter((recipe) => recipe.category_name === name)
					.map((recipe, index) => (
						<FoodContentSectionItem key={index} recipe={recipe} />
					))}
			</div>
		</div>
	);
};

export default FoodContentSection;
