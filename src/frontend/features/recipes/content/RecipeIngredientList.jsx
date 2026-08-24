import React from "react";

const toIngredientText = (ingredient) => (
	typeof ingredient === "string" ? ingredient : JSON.stringify(ingredient)
);

const toStructuredIngredientText = (ingredient) => {
	const quantity = ingredient.quantityText || ingredient.quantity_text || (ingredient.quantity ?? "");
	return [quantity, ingredient.unit, ingredient.name]
		.filter((value) => String(value || "").trim())
		.join(" ")
		.concat((ingredient.preparation || ingredient.preparation_text)?.trim() ? ` (${(ingredient.preparation || ingredient.preparation_text).trim()})` : "");
};

const RecipeIngredientList = ({ ingredients, structuredIngredients }) => {
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
			{ingredientList.map((ingredient, index) => (
				<li key={`${index}:${toIngredientText(ingredient)}`}>
					<span>{structuredList.length ? toStructuredIngredientText(ingredient) : toIngredientText(ingredient)}</span>
				</li>
			))}
		</ul>
	);
};

export default RecipeIngredientList;
