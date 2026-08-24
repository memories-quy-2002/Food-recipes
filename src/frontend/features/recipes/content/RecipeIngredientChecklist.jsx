import React, { useEffect, useState } from "react";
import { formatStructuredIngredient } from "../structuredIngredients";

const toIngredientText = (ingredient) => (
	typeof ingredient === "string" ? ingredient : formatStructuredIngredient(ingredient)
);

const toRecipeScope = (recipeIdentity) => String(recipeIdentity ?? "recipe").replace(/[^a-zA-Z0-9_-]/g, "-");

export const getIngredientSignature = (ingredients) => (ingredients || [])
	.map((ingredient, index) => `${index}:${toIngredientText(ingredient)}`)
	.join("|");

const RecipeIngredientChecklist = ({ recipeIdentity, ingredients }) => {
	const ingredientList = Array.isArray(ingredients) ? ingredients : [];
	const recipeScope = toRecipeScope(recipeIdentity);
	const ingredientSignature = getIngredientSignature(ingredientList);
	const [checkedIngredients, setCheckedIngredients] = useState(() => new Set());

	useEffect(() => {
		setCheckedIngredients(new Set());
	}, [recipeIdentity, ingredientSignature]);

	if (!ingredientList.length) return "No information";

	return (
		<>
			<p className="recipe__ingredient-checklist__hint">
				Check off ingredients as you gather them. This checklist is local to this page.
			</p>
			<ul className="recipe__ingredient-checklist" aria-label="Ingredients checklist">
				{ingredientList.map((ingredient, index) => {
					const text = toIngredientText(ingredient);
					const ingredientId = `${recipeScope}-ingredient-${index}`;
					const isChecked = checkedIngredients.has(index);

					return (
						<li key={ingredientId}>
							<label className={`recipe__ingredient-checklist__item${isChecked ? " is-checked" : ""}`} htmlFor={ingredientId}>
								<input
									id={ingredientId}
									type="checkbox"
									checked={isChecked}
									aria-label={`Mark ${text} as complete`}
									onChange={(event) => setCheckedIngredients((current) => {
										const next = new Set(current);
										if (event.target.checked) next.add(index);
										else next.delete(index);
										return next;
									})}
								/>
								<span>{text}</span>
							</label>
						</li>
					);
				})}
			</ul>
		</>
	);
};

export default RecipeIngredientChecklist;
