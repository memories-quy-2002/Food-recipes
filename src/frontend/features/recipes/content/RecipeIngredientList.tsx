import React from "react";
import type { StructuredIngredient } from "@/shared/api/contracts";

type ReadableStructuredIngredient = StructuredIngredient & {
	quantity_text?: string | null;
	preparation_text?: string | null;
};

const toIngredientText = (ingredient: string | ReadableStructuredIngredient): string => (
	typeof ingredient === "string" ? ingredient : String(JSON.stringify(ingredient))
);

const toStructuredIngredientText = (ingredient: ReadableStructuredIngredient): string => {
	const quantity = ingredient.quantityText || ingredient.quantity_text || (ingredient.quantity ?? "");
	const preparation = ingredient.preparation || ingredient.preparation_text;
	return [quantity, ingredient.unit, ingredient.name]
		.filter((value) => String(value || "").trim())
		.join(" ")
		.concat(preparation?.trim() ? ` (${preparation.trim()})` : "");
};

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
			{ingredientList.map((ingredient, index) => (
				<li key={`${index}:${toIngredientText(ingredient)}`}>
					<span>{structuredList.length && typeof ingredient !== "string" ? toStructuredIngredientText(ingredient) : toIngredientText(ingredient)}</span>
				</li>
			))}
		</ul>
	);
};

export default RecipeIngredientList;
