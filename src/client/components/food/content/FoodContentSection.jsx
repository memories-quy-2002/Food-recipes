import React from "react";
import FoodContentSectionItem from "./FoodContentSectionItem";

const FoodContentSection = ({ id, name, recipes, viewMode }) => {
	return (
		<div key={id} className="food__content__section">
			<h4 className="food__content__section__title">{name}</h4>
			<div
				className={`food__content__section__list food__content__section__list--${viewMode}`}
			>
				{recipes
					.filter((recipe) => recipe.category_name === name)
					.map((recipe) => (
						<FoodContentSectionItem
							key={recipe.recipe_id}
							recipe={recipe}
						/>
					))}
			</div>
		</div>
	);
};

export default FoodContentSection;
