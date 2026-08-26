import React from "react";
import { formatStructuredIngredient, type ReadableStructuredIngredient } from "../structuredIngredients";

type RecipeIngredientListProps = {
	ingredients?: string[] | null;
	structuredIngredients?: ReadableStructuredIngredient[] | null;
};

const RecipeIngredientList = ({ ingredients, structuredIngredients }: RecipeIngredientListProps): React.ReactElement => {
	const structuredList = Array.isArray(structuredIngredients)
		? structuredIngredients.filter((ingredient) => ingredient?.name?.trim())
		: [];
	const ingredientList = structuredList.length
		? structuredList
		: Array.isArray(ingredients)
			? ingredients
			: [];

	if (!ingredientList.length) {
		return <p className="recipe__ingredient-empty">No information</p>;
	}

	return (
		<ul className="recipe__ingredient-list" aria-label="Ingredients">
			{ingredientList.map((ingredient, index) => {
				const text = typeof ingredient === "string" ? ingredient : formatStructuredIngredient(ingredient);
				return (
					<li key={`${index}:${text}`}>
						<span>{text}</span>
					</li>
				);
			})}
		</ul>
	);
};

export default RecipeIngredientList;
